import Link from "next/link";
import { notFound } from "next/navigation";
import { Wordmark } from "@/components/brand";
import { MarkdownView } from "@/components/markdown-view";
import { getDb } from "@/lib/db";
import { getSharedProject } from "@/lib/repo";
import { text } from "@/lib/consultant/shared";
import { phaseLabel } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const bundle = getSharedProject(getDb(), token);
  if (!bundle) notFound();
  const locale = bundle.profile.locale;
  const brand = bundle.brands.find((item) => item.id === bundle.selectedBrandId);
  return (
    <main id="content" className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/"><Wordmark /></Link>
      <p className="mt-8 text-sm text-muted">{text(locale, "תצוגה לקריאה בלבד. השיתוף נפתח במפורש על ידי בעלי הפרויקט.", "Read-only view. Sharing was opened explicitly by the project owner.")}</p>
      <h1 className="mt-3 font-serif text-5xl">{bundle.name}</h1>
      <p className="mt-4 text-muted">{bundle.analysis.disclaimer}</p>
      <div className="mt-8 grid gap-8">
        {bundle.plan.map((section) => (
          <section key={section.id}>
            <h2 className="font-serif text-2xl">{section.title}</h2>
            <MarkdownView source={section.content} />
          </section>
        ))}
      </div>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">{text(locale, "מותג", "Brand")}</h2>
        <p className="mt-2">{brand ? brand.chosenName : text(locale, "טרם נבחר כיוון.", "No direction selected.")}</p>
        {brand && <p className="mt-2 text-sm text-muted">{brand.trademarkNote}</p>}
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">{text(locale, "משימות פתוחות", "Open tasks")}</h2>
        <ul className="mt-3 space-y-2">
          {bundle.tasks.filter((task) => !task.done).map((task) => (
            <li key={task.id}>{phaseLabel(task.phase, locale)} · {task.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
