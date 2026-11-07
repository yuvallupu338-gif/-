import { NewProjectForm } from "@/components/idea-form";
import { text } from "@/lib/consultant/shared";
import { uiLocale } from "@/server/session";

export default async function NewProjectPage() {
  const locale = await uiLocale();
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">{text(locale, "פרויקט חדש", "New project")}</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{text(locale, "ספרו על העסק.", "Tell us about the business.")}</h1>
      <div className="mt-8">
        <NewProjectForm locale={locale} />
      </div>
    </div>
  );
}
