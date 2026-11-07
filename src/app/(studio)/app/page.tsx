import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMoney, formatWhen } from "@/lib/format";
import { getDb } from "@/lib/db";
import { listNotifications, listProjects } from "@/lib/repo";
import { text } from "@/lib/consultant/shared";
import { requireUser, uiLocale } from "@/server/session";
import { MarkRead } from "@/components/mark-read";

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await uiLocale();
  const db = getDb();
  const projects = listProjects(db, user.id);
  const notes = listNotifications(db, user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{text(locale, `שלום ${user.name}`, `Hello ${user.name}`)}</p>
          <h1 className="mt-2 font-serif text-4xl md:text-5xl">{text(locale, "מה ממשיכים", "What to continue")}</h1>
        </div>
        <Button asChild><Link href="/app/projects/new">{text(locale, "פרויקט חדש", "New project")}</Link></Button>
      </div>
      {projects.length === 0 ? (
        <div className="mt-10 border border-line bg-surface p-8">
          <p className="max-w-xl font-serif text-3xl leading-snug">{text(locale, "אין עדיין פרויקט. משפט אחד על העסק מספיק כדי לפתוח סביבת עבודה.", "There is no project yet. One sentence about the business is enough to open a workspace.")}</p>
          <Button asChild className="mt-6"><Link href="/app/projects/new">{text(locale, "תיאור הרעיון", "Describe the idea")}</Link></Button>
        </div>
      ) : (
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {projects.map((project) => (
            <li key={project.id} className="grid gap-3 py-5 md:grid-cols-12 md:items-center">
              <div className="md:col-span-5">
                <Link href={`/app/projects/${project.id}`} className="font-serif text-2xl">{project.name}</Link>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{project.idea}</p>
              </div>
              <p className="text-sm text-muted md:col-span-3">{project.location || "—"} · <span className="num">{formatMoney(project.budget, project.currency, locale)}</span></p>
              <div className="md:col-span-2">
                <div className="h-1 bg-line"><div className="h-1 bg-ink" style={{ width: `${project.progress}%` }} /></div>
                <p className="mt-1 text-xs text-muted num">{project.progress}%</p>
              </div>
              <Link href={project.nextHref} className="text-sm underline-offset-4 hover:underline md:col-span-2">{project.nextLabel}</Link>
            </li>
          ))}
        </ol>
      )}
      <section className="mt-12">
        <h2 className="font-serif text-2xl">{text(locale, "אירועים", "Events")}</h2>
        {notes.length === 0 ? <p className="mt-3 text-sm text-muted">{text(locale, "עדיין אין אירועי עבודה.", "No workflow events yet.")}</p> : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {notes.map((note) => (
              <li key={note.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <div>
                  <p className={note.read ? "text-muted" : ""}>{note.title}</p>
                  <p className="text-sm text-muted">{note.body}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <time className="text-muted">{formatWhen(note.createdAt, locale)}</time>
                  {note.href && <Link href={note.href} className="underline-offset-4 hover:underline">{text(locale, "פתיחה", "Open")}</Link>}
                  {!note.read && <MarkRead id={note.id} label={text(locale, "סומן", "Mark read")} />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
