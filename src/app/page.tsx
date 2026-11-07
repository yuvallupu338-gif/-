import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { IdeaComposer } from "@/components/idea-form";
import { Preferences } from "@/components/preferences";
import { text } from "@/lib/consultant/shared";
import { currentUser, uiLocale, uiTheme } from "@/server/session";

export default async function HomePage() {
  const [locale, theme, user] = await Promise.all([uiLocale(), uiTheme(), currentUser()]);
  const steps = [
    ["01", text(locale, "גילוי", "Discovery"), text(locale, "הרעיון נפרק להנחות, בעיות, הבחנה וסיכונים. בלי נתוני שוק מומצאים.", "The idea becomes assumptions, problems, differentiation, and risks. No invented market statistics.")],
    ["02", text(locale, "תוכנית", "Plan"), text(locale, "אחד עשר סעיפים שאפשר לערוך, לנעול ולרענן בנפרד.", "Eleven sections you can edit, lock, and refresh one at a time.")],
    ["03", text(locale, "מותג ואתר", "Brand and site"), text(locale, "שלושה כיוונים להשוואה, ואתר טיוטה שנבנה מהכיוון שנבחר.", "Three directions to compare, and a draft site built from the one you choose.")],
    ["04", text(locale, "מספרים", "Numbers"), text(locale, "תזרים, שולי רווח ונקודת איזון מחושבים מההנחות שלכם.", "Cash flow, margin, and break-even are calculated from your assumptions.")],
    ["05", text(locale, "השקה", "Launch"), text(locale, "מפת דרכים עם משימות, תלויות וייצוא של מה שנשמר.", "A roadmap with tasks, dependencies, and exports of what was saved.")],
  ];
  return (
    <div>
      <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-10">
        <Link href="/"><Wordmark /></Link>
        <div className="flex items-center gap-4">
          <Preferences locale={locale} theme={theme} />
          <Link href={user ? "/app" : "/login"} className="text-sm">{user ? text(locale, "לסטודיו", "Studio") : text(locale, "כניסה", "Log in")}</Link>
        </div>
      </header>
      <main id="content">
        <section className="grid items-end gap-10 px-5 pb-16 pt-8 md:px-10 lg:grid-cols-12 lg:pt-16">
          <div className="lg:col-span-7">
            <p className="text-sm text-muted">{text(locale, "סטודיו להשקת עסקים", "A studio for launching a business")}</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
              {text(locale, "מרעיון עסקי לתוכנית השקה.", "From a business idea to a launch plan.")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {text(locale, "LaunchLab שומר פרויקט אחד: אסטרטגיה, מותג, אתר, מספרים ותוכנית פעולה. העריכות שלכם נשמרות. אין כאן הבטחת רווח.", "LaunchLab keeps one project: strategy, brand, site, numbers, and a plan of action. Your edits stay. There is no promise of profit.")}
            </p>
          </div>
          <div className="lg:col-span-5">
            <IdeaComposer locale={locale} loggedIn={Boolean(user)} compact />
          </div>
        </section>
        <section className="border-t border-line px-5 py-14 md:px-10">
          <h2 className="font-serif text-3xl">{text(locale, "חמישה מהלכים, לא לוח מחוונים.", "Five moves, not a dashboard of widgets.")}</h2>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {steps.map(([index, title, body]) => (
              <li key={index} className="grid gap-3 py-5 md:grid-cols-12 md:items-baseline">
                <span className="text-sm text-muted md:col-span-1">{index}</span>
                <h3 className="font-serif text-2xl md:col-span-3">{title}</h3>
                <p className="text-muted md:col-span-8">{body}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="bg-sidebar px-5 py-14 text-sidebar-ink md:px-10">
          <p className="text-sm text-sidebar-muted">{text(locale, "דוגמה לניסוח, לא פרויקט שמור", "An example of wording, not a saved project")}</p>
          <p className="mt-4 max-w-3xl font-serif text-3xl leading-snug md:text-4xl">
            {text(locale, "«אני רוצה להשיק מותג ביגוד כושר פרימיום בישראל, עם תקציב התחלתי של 40,000 ש״ח.»", "“I want to launch a premium training-apparel brand in Israel, with a starting budget of ₪40,000.”")}
          </p>
          <p className="mt-6 max-w-2xl text-sidebar-muted">
            {text(locale, "הסטודיו יפתח מזה הנחות, תקציב שמסתכם ל־40,000, שלושה כיווני מותג, טיוטת אתר ומפת משימות. השמות לא נבדקו כסימן מסחר.", "The studio turns that into assumptions, a budget that adds up to 40,000, three brand directions, a site draft, and a task map. The names are not trademark-cleared.")}
          </p>
        </section>
      </main>
    </div>
  );
}
