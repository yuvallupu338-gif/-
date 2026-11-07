"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { addTaskAction, deleteTaskAction, saveTaskAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { PhaseKey, ProjectBundle, RoadTask } from "@/lib/domain";
import { phaseLabel, phasesInOrder } from "@/lib/progress";
import { useRouter } from "next/navigation";

export function RoadmapStudio({ bundle }: { bundle: ProjectBundle }) {
  const locale = bundle.profile.locale;
  const router = useRouter();
  const [tasks, setTasks] = useState(bundle.tasks);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<PhaseKey, string>>>({});
  const done = tasks.filter((task) => task.done).length;
  async function persist(task: RoadTask) {
    const result = await saveTaskAction(bundle.id, task);
    if (!result.ok) {
      setError(result.error);
      setTasks(bundle.tasks);
    } else setError(null);
  }
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-serif text-4xl">{text(locale, "מפת דרכים", "Roadmap")}</h1>
      <p className="mt-3 text-sm text-muted"><span className="num">{done}/{tasks.length}</span> · {text(locale, "אי אפשר לסמן משימה שהתלות שלה פתוחה.", "A task cannot be completed while its dependency is open.")}</p>
      <div className="mt-3 h-1 bg-line"><div className="h-1 bg-ink" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div>
      {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      <div className="mt-8 grid gap-8">
        {phasesInOrder().map((phase) => {
          const rows = tasks.filter((task) => task.phase === phase);
          const phaseDone = rows.length > 0 && rows.every((task) => task.done);
          return (
            <section key={phase}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-2xl">{phaseLabel(phase, locale)}</h2>
                <span className="text-sm text-muted">{phaseDone ? text(locale, "הושלם", "Complete") : `${rows.filter((task) => task.done).length}/${rows.length}`}</span>
              </div>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {rows.map((task) => {
                  const dependency = tasks.find((item) => item.id === task.dependsOn);
                  return (
                    <li key={task.id} className="grid gap-3 py-4">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1" checked={task.done} onChange={(event) => {
                          const next = { ...task, done: event.target.checked };
                          setTasks(tasks.map((item) => item.id === task.id ? next : item));
                          void persist(next);
                        }} aria-label={task.title} />
                        <Input value={task.title} onChange={(event) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, title: event.target.value } : item))} onBlur={(event) => void persist({ ...task, title: event.target.value })} />
                        <select className="h-11 border border-line bg-surface px-2 text-sm" value={task.priority} onChange={(event) => {
                          const next = { ...task, priority: event.target.value as RoadTask["priority"] };
                          setTasks(tasks.map((item) => item.id === task.id ? next : item));
                          void persist(next);
                        }}>
                          <option value="high">{text(locale, "גבוהה", "High")}</option>
                          <option value="medium">{text(locale, "בינונית", "Medium")}</option>
                          <option value="low">{text(locale, "נמוכה", "Low")}</option>
                        </select>
                      </div>
                      <Textarea className="min-h-20" value={task.notes} onChange={(event) => setTasks(tasks.map((item) => item.id === task.id ? { ...item, notes: event.target.value } : item))} onBlur={(event) => void persist({ ...task, notes: event.target.value })} />
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
                        <span>{dependency ? text(locale, `תלוי ב: ${dependency.title}${dependency.done ? "" : " (פתוח)"}`, `Depends on: ${dependency.title}${dependency.done ? "" : " (open)"}`) : text(locale, "בלי תלות", "No dependency")}</span>
                        <button type="button" className="text-danger" onClick={async () => {
                          const result = await deleteTaskAction(bundle.id, task.id);
                          if (!result.ok) setError(result.error);
                          else router.refresh();
                        }}>{text(locale, "מחיקה", "Delete")}</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form className="mt-3 flex gap-2" onSubmit={async (event) => {
                event.preventDefault();
                const title = drafts[phase]?.trim() ?? "";
                const result = await addTaskAction(bundle.id, phase, title);
                if (!result.ok) setError(result.error);
                else { setDrafts({ ...drafts, [phase]: "" }); router.refresh(); }
              }}>
                <Input value={drafts[phase] ?? ""} placeholder={text(locale, "משימה חדשה", "New task")} onChange={(event) => setDrafts({ ...drafts, [phase]: event.target.value })} />
                <Button type="submit" variant="outline">{text(locale, "הוספה", "Add")}</Button>
              </form>
            </section>
          );
        })}
      </div>
    </div>
  );
}
