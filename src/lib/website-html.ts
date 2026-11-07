import type { ProjectBundle } from "@/lib/domain";
import { escapeHtml, safeHttpUrl } from "@/lib/utils";

function items(section: ProjectBundle["website"]["sections"][number]) {
  return section.content.items ?? [];
}

export function websiteFiles(bundle: ProjectBundle) {
  const site = bundle.website;
  const theme = site.theme;
  const visible = site.sections.filter((section) => section.visible);
  const nav = visible.find((section) => section.type === "nav");
  const body = visible
    .map((section) => {
      const title = escapeHtml(section.content.title ?? "");
      const subtitle = escapeHtml(section.content.subtitle ?? "");
      const text = escapeHtml(section.content.body ?? "");
      const button = escapeHtml(section.content.button ?? "");
      if (section.type === "nav") {
        return `<header class="nav"><a class="mark" href="#top">${title}</a><nav>${items(section)
          .map((item) => `<a href="#${escapeHtml(item.text)}">${escapeHtml(item.title)}</a>`)
          .join("")}</nav></header>`;
      }
      if (section.type === "hero") {
        const image = section.content.image === "custom" ? safeHttpUrl(section.content.imageUrl) : "";
        return `<section class="hero ${escapeHtml(section.content.image ?? "none")}" id="top" ${image ? `style="background-image:url('${escapeHtml(image)}')"` : ""}><p class="eyebrow">${escapeHtml(section.content.eyebrow ?? "")}</p><h1>${title}</h1><p class="lede">${subtitle}</p><p>${text}</p>${button ? `<a class="button" href="#contact">${button}</a>` : ""}</section>`;
      }
      if (section.type === "products" || section.type === "pricing" || section.type === "features" || section.type === "faq") {
        return `<section id="${section.type}"><h2>${title}</h2>${subtitle ? `<p class="lede">${subtitle}</p>` : ""}<div class="grid">${items(section)
          .map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p>${item.meta ? `<p class="meta">${escapeHtml(item.meta)}</p>` : ""}</article>`)
          .join("")}</div></section>`;
      }
      if (section.type === "contact") {
        return `<section id="contact"><h2>${title}</h2><p>${text}</p>${button ? `<p><a class="button" href="mailto:${button}">${button}</a></p>` : ""}</section>`;
      }
      if (section.type === "footer") return `<footer><strong>${title}</strong><p>${text}</p></footer>`;
      return `<section id="${section.type}"><p class="eyebrow">${escapeHtml(section.content.eyebrow ?? "")}</p><h2>${title}</h2><p>${text}</p></section>`;
    })
    .join("\n");
  const css = `:root{--bg:${theme.background};--surface:${theme.surface};--ink:${theme.text};--muted:${theme.muted};--accent:${theme.accent};--accent-ink:${theme.accentText};--serif:"${theme.headingFont}",serif;--sans:"${theme.bodyFont}",sans-serif}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);line-height:1.6}header,section,footer{padding:48px 8vw}h1,h2,h3{font-family:var(--serif);font-weight:560;letter-spacing:-.03em;line-height:1.05}h1{font-size:clamp(48px,8vw,92px);margin:12px 0}.nav{display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent)}.nav nav{display:flex;gap:18px}.nav a{color:inherit;text-decoration:none}.lede{font-size:1.2rem;max-width:38rem}.button{display:inline-block;margin-top:16px;background:var(--accent);color:var(--accent-ink);text-decoration:none;padding:12px 16px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.grid article{background:var(--surface);padding:20px;border:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}.meta,.eyebrow{color:var(--muted);font-size:.85rem}.hero.wash{background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 55%,var(--bg)),var(--bg))}.hero.grid{background-image:linear-gradient(color-mix(in srgb,var(--ink) 8%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--ink) 8%,transparent) 1px,transparent 1px);background-size:32px 32px}.hero.custom{background-size:cover;background-position:center}footer{border-top:1px solid color-mix(in srgb,var(--ink) 12%,transparent)}@media(max-width:700px){.nav{flex-direction:column;align-items:flex-start}header,section,footer{padding:32px 20px}}`;
  const html = `<!doctype html><html lang="${bundle.profile.locale}" dir="${bundle.profile.locale === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(nav?.content.title || bundle.name)}</title><link rel="stylesheet" href="styles.css"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600&family=Frank+Ruhl+Libre:wght@500;700&family=Heebo:wght@400;500;600&family=Rubik:wght@500;650&display=swap" rel="stylesheet"/></head><body>${body}</body></html>`;
  const readme = `LaunchLab static export\nThis folder is a saved copy of the website draft for ${bundle.name}.\nIt does not publish itself. Open index.html in a browser.\nDo not treat the copy as trademark clearance or as market proof.\n`;
  return { "index.html": html, "styles.css": css, "README.txt": readme };
}

export function summaryMarkdown(bundle: ProjectBundle) {
  const lines = [
    `# ${bundle.name}`,
    "",
    bundle.profile.locale === "he" ? `נוצר: ${bundle.createdAt}` : `Created: ${bundle.createdAt}`,
    "",
    bundle.analysis.disclaimer,
    "",
    `## ${bundle.profile.locale === "he" ? "רעיון" : "Idea"}`,
    "",
    bundle.idea,
    "",
    ...bundle.plan.flatMap((section) => [`## ${section.title}`, "", section.content, ""]),
    `## ${bundle.profile.locale === "he" ? "מותג" : "Brand"}`,
    "",
    ...(bundle.brands.find((brand) => brand.id === bundle.selectedBrandId)
      ? [`${bundle.brands.find((brand) => brand.id === bundle.selectedBrandId)?.chosenName}`, "", bundle.brands.find((brand) => brand.id === bundle.selectedBrandId)?.trademarkNote ?? ""]
      : [bundle.profile.locale === "he" ? "טרם נבחר כיוון." : "No direction selected."]),
    "",
    `## ${bundle.profile.locale === "he" ? "משימות פתוחות" : "Open tasks"}`,
    "",
    ...bundle.tasks.filter((task) => !task.done).map((task) => `- [${task.phase}] ${task.title}`),
    "",
  ];
  return lines.join("\n");
}

export function calendarCsv(bundle: ProjectBundle) {
  const rows = ["day,channel,concept,caption"];
  for (const item of bundle.calendar) {
    rows.push([item.day, csv(item.channel), csv(item.concept), csv(item.caption)].join(","));
  }
  return `\uFEFF${rows.join("\n")}\n`;
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
