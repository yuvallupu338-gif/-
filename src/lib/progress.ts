import type { PhaseKey, ProjectBundle } from "@/lib/domain";
import { PHASES } from "@/lib/domain";
import { text } from "@/lib/consultant/shared";

export type ModuleStatus = {
  key: string;
  label: string;
  href: string;
  state: "ready" | "draft" | "open";
  detail: string;
};

export function projectStatus(bundle: ProjectBundle) {
  const locale = bundle.profile.locale;
  const base = `/app/projects/${bundle.id}`;
  const planReady = bundle.plan.every((section) => section.content.trim().length > 40);
  const brandReady = Boolean(bundle.selectedBrandId);
  const websiteReady = bundle.website.touched;
  const financeReady = bundle.profile.financeReviewed;
  const marketingReady = bundle.profile.marketingReviewed;
  const tasksDone = bundle.tasks.filter((task) => task.done).length;
  const taskRatio = bundle.tasks.length ? tasksDone / bundle.tasks.length : 0;
  const percent = Math.round(
    (planReady ? 15 : 8) +
      (brandReady ? 15 : 0) +
      (websiteReady ? 15 : 5) +
      (financeReady ? 15 : 0) +
      (marketingReady ? 15 : 0) +
      10 +
      taskRatio * 15,
  );
  const next = !brandReady
    ? { href: `${base}/brand`, label: text(locale, "לבחור כיוון מותג", "Choose a brand direction") }
    : !websiteReady
      ? { href: `${base}/website`, label: text(locale, "לערוך את טיוטת האתר", "Edit the website draft") }
      : !financeReady
        ? { href: `${base}/finance`, label: text(locale, "לבדוק את הנחות המודל", "Review the model assumptions") }
        : !marketingReady
          ? { href: `${base}/marketing`, label: text(locale, "לערוך את חומרי השיווק", "Edit the marketing drafts") }
          : (() => {
              const task = bundle.tasks.find((item) => !item.done && item.priority === "high") ?? bundle.tasks.find((item) => !item.done);
              return task
                ? { href: `${base}/roadmap`, label: task.title }
                : { href: `${base}/export`, label: text(locale, "לייצא את החומרים", "Export the materials") };
            })();
  const modules: ModuleStatus[] = [
    { key: "discovery", label: text(locale, "גילוי", "Discovery"), href: `${base}/discovery`, state: "ready", detail: bundle.analysis.mode === "model" ? text(locale, "נוצר עם מודל", "Created with a model") : text(locale, "ניתוח ראשוני", "Preliminary") },
    { key: "plan", label: text(locale, "תוכנית", "Plan"), href: `${base}/plan`, state: planReady ? "ready" : "draft", detail: text(locale, `${bundle.plan.length} סעיפים`, `${bundle.plan.length} sections`) },
    { key: "brand", label: text(locale, "מותג", "Brand"), href: `${base}/brand`, state: brandReady ? "ready" : "open", detail: brandReady ? text(locale, "כיוון נבחר", "Direction selected") : text(locale, "טרם נבחר", "Not selected") },
    { key: "website", label: text(locale, "אתר", "Website"), href: `${base}/website`, state: websiteReady ? "ready" : "draft", detail: websiteReady ? text(locale, "נערך", "Edited") : text(locale, "טיוטה", "Draft") },
    { key: "finance", label: text(locale, "פיננסים", "Finance"), href: `${base}/finance`, state: financeReady ? "ready" : "open", detail: financeReady ? text(locale, "ההנחות נשמרו אחרי בדיקה", "Assumptions saved after review") : text(locale, "הערכות שלא נבדקו", "Unreviewed estimates") },
    { key: "marketing", label: text(locale, "שיווק", "Marketing"), href: `${base}/marketing`, state: marketingReady ? "ready" : "draft", detail: text(locale, `${bundle.marketing.length} נכסים`, `${bundle.marketing.length} assets`) },
    { key: "roadmap", label: text(locale, "מפת דרכים", "Roadmap"), href: `${base}/roadmap`, state: taskRatio === 1 ? "ready" : "open", detail: text(locale, `${tasksDone} מתוך ${bundle.tasks.length}`, `${tasksDone} of ${bundle.tasks.length}`) },
  ];
  return { percent, nextHref: next.href, nextLabel: next.label, modules, tasksDone, taskTotal: bundle.tasks.length };
}

export function phaseLabel(phase: PhaseKey, locale: ProjectBundle["profile"]["locale"]) {
  const labels: Record<PhaseKey, [string, string]> = {
    validation: ["אימות", "Validation"],
    planning: ["תכנון", "Planning"],
    branding: ["מיתוג", "Branding"],
    setup: ["הקמה", "Setup"],
    website: ["אתר", "Website"],
    marketing: ["הכנה שיווקית", "Marketing preparation"],
    launch: ["השקה", "Launch"],
    growth: ["צמיחה", "Growth"],
  };
  return text(locale, labels[phase][0], labels[phase][1]);
}

export function phasesInOrder() {
  return PHASES;
}
