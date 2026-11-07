"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { createProjectAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import { BUSINESS_TYPES, CURRENCIES, EXPERIENCE_LEVELS, INDUSTRIES, type Locale } from "@/lib/domain";
import { industryLabel, businessTypeLabel, experienceLabel } from "@/lib/consultant/shared";

export function IdeaComposer({ locale, loggedIn, compact = false }: { locale: Locale; loggedIn: boolean; compact?: boolean }) {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  function go() {
    if (idea.trim()) sessionStorage.setItem("ll-idea", idea.trim());
    router.push(loggedIn ? "/app/projects/new" : "/register?next=/app/projects/new");
  }
  if (compact) {
    return (
      <form className="border border-line bg-surface p-4 md:p-5" onSubmit={(event) => { event.preventDefault(); go(); }}>
        <Label htmlFor="landing-idea">{text(locale, "הרעיון", "The idea")}</Label>
        <Textarea id="landing-idea" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder={text(locale, "אני רוצה להשיק מותג ביגוד כושר פרימיום בישראל, עם תקציב התחלתי של 40,000 ש״ח.", "I want to launch a premium training-apparel brand in Israel, with a starting budget of ₪40,000.")} />
        <Button className="mt-4 w-full" type="submit" size="lg">{loggedIn ? text(locale, "המשך לפרטים", "Continue") : text(locale, "פתיחת סטודיו", "Open the studio")}</Button>
      </form>
    );
  }
  return null;
}

export function NewProjectForm({ locale }: { locale: Locale }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [idea, setIdea] = useState("");
  useEffect(() => {
    const saved = sessionStorage.getItem("ll-idea");
    if (saved) setIdea(saved);
  }, []);
  return (
    <form
      className="grid gap-8"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
        data.set("idea", idea);
        start(async () => {
          const result = await createProjectAction(data);
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      <div>
        <Label htmlFor="idea">{text(locale, "תארו את העסק", "Describe the business")}</Label>
        <Textarea id="idea" name="idea" required minLength={10} value={idea} onChange={(event) => setIdea(event.target.value)} className="min-h-44 text-lg" />
      </div>
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-3 text-sm text-muted">{text(locale, "פרטים שמחדדים את התוצר. אפשר להשאיר חלק ריק.", "Details that sharpen the result. Some can stay empty.")}</legend>
        <div>
          <Label htmlFor="industryKey">{text(locale, "תחום", "Industry")}</Label>
          <Select id="industryKey" name="industryKey" defaultValue="general">
            {INDUSTRIES.map((key) => <option key={key} value={key}>{industryLabel(key, locale, "")}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="businessType">{text(locale, "סוג פעילות", "Activity type")}</Label>
          <Select id="businessType" name="businessType" defaultValue="product">
            {BUSINESS_TYPES.map((key) => <option key={key} value={key}>{businessTypeLabel(key, locale)}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="location">{text(locale, "מיקום השקה", "Launch location")}</Label>
          <Input id="location" name="location" placeholder={text(locale, "תל אביב", "Tel Aviv")} />
        </div>
        <div>
          <Label htmlFor="audience">{text(locale, "קהל", "Audience")}</Label>
          <Input id="audience" name="audience" placeholder={text(locale, "אנשים שמתאמנים אחרי העבודה", "People who train after work")} />
        </div>
        <div>
          <Label htmlFor="budget">{text(locale, "תקציב התחלתי", "Starting budget")}</Label>
          <Input id="budget" name="budget" inputMode="decimal" placeholder="40000" />
          <p className="mt-1 text-xs text-muted">{text(locale, "אם השדה ריק ומופיע סכום בתיאור, הוא ייקרא משם ויסומן כהערכה.", "If this stays empty and the description names an amount, that amount is read as an estimate.")}</p>
        </div>
        <div>
          <Label htmlFor="currency">{text(locale, "מטבע", "Currency")}</Label>
          <Select id="currency" name="currency" defaultValue="ILS">
            {CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="experience">{text(locale, "ניסיון", "Experience")}</Label>
          <Select id="experience" name="experience" defaultValue="first">
            {EXPERIENCE_LEVELS.map((key) => <option key={key} value={key}>{experienceLabel(key, locale)}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="goals">{text(locale, "יעד להשקה", "Launch goal")}</Label>
          <Input id="goals" name="goals" placeholder={text(locale, "30 הזמנות ראשונות בתוך 90 יום", "30 first orders within 90 days")} />
        </div>
      </fieldset>
      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center">
        <Button type="submit" name="mode" value="preliminary" disabled={pending} size="lg">{pending ? text(locale, "בונים את סביבת העבודה", "Building the workspace") : text(locale, "יצירת ניתוח ראשוני", "Create a preliminary analysis")}</Button>
        <Button type="submit" name="mode" value="model" variant="outline" disabled={pending} size="lg">{text(locale, "יצירה עם מודל, אם הוגדר", "Create with a model, if configured")}</Button>
      </div>
      <p className="text-sm text-muted">{text(locale, "בלי מפתח למודל השפה תתקבל סביבה ראשונית שמסומנת ככזו. אם המודל נכשל, הפרויקט לא נשמר.", "Without a language-model key you get a preliminary workspace, labeled as such. If a model fails, the project is not saved.")}</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  );
}
