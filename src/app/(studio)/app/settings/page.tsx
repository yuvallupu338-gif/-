import { integrationStatus } from "@/lib/ai";
import { text } from "@/lib/consultant/shared";
import { requireUser, uiLocale } from "@/server/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const locale = await uiLocale();
  const status = integrationStatus();
  const rows = [
    [text(locale, "מסד מקומי", "Local database"), text(locale, "פעיל. SQLite על השרת, עם בדיקת בעלות בכל פעולה.", "Active. SQLite on the server, with an ownership check on every action.")],
    [text(locale, "Supabase", "Supabase"), status.supabaseConfigured ? text(locale, "משתני סביבה קיימים. הריצה הזו עדיין נשמרת ב-SQLite.", "Environment variables are present. This runtime still saves to SQLite.") : text(locale, "לא הוגדר. סכמת RLS מוכנה בקובץ המיגרציה.", "Not configured. The RLS schema is in the migration file.")],
    [text(locale, "מודל שפה", "Language model"), status.configured ? text(locale, `מחובר (${status.provider}).`, `Connected (${status.provider}).`) : text(locale, "לא הוגדר. היצירה הראשונית מסומנת כניתוח ראשוני.", "Not configured. Generation is labeled as a preliminary analysis.")],
    [text(locale, "תמונות", "Images"), status.imageEnabled ? text(locale, "יצירת לוגו מופעלת.", "Logo image generation is on.") : text(locale, "כבוי. מוצגות סקיצות לוגו לעריכה.", "Off. Editable logo sketches are shown.")],
    [text(locale, "פרסום אתר", "Site publishing"), status.publishEnabled ? text(locale, "קיים כתובת פרסום.", "A publish hook is set.") : text(locale, "לא הוגדר. אפשר לייצא אתר סטטי.", "Not configured. You can export a static site.")],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl">{text(locale, "הגדרות", "Settings")}</h1>
      <p className="mt-3 text-muted">{user.email}</p>
      <dl className="mt-8 divide-y divide-line border-y border-line">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-4 md:grid-cols-3">
            <dt>{label}</dt>
            <dd className="text-muted md:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
