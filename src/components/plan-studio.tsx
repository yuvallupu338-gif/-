"use client";

import { useState } from "react";
import { MarkdownView } from "@/components/markdown-view";
import { SaveNote } from "@/components/discovery-studio";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { regenerateSectionAction, restoreSectionAction, saveSectionAction, sectionHistory, setSectionLockAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { PlanKey, ProjectBundle } from "@/lib/domain";
import { formatWhen } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PlanStudio({ bundle, modelConfigured }: { bundle: ProjectBundle; modelConfigured: boolean }) {
  const locale = bundle.profile.locale;
  const [active, setActive] = useState<PlanKey>(bundle.plan[0]?.key ?? "executive");
  const [sections, setSections] = useState(bundle.plan);
  const section = sections.find((item) => item.key === active) ?? sections[0];
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; createdAt: string; data: { title: string; content: string } }[]>([]);
  const [preview, setPreview] = useState(false);
  const save = useAutosave(`${section?.key}:${section?.title}:${section?.content}`, async () => {
    if (!section) return { ok: true };
    return saveSectionAction(bundle.id, section.key, section.content, section.title);
  });
  if (!section) return null;
  function patch(partial: Partial<typeof section>) {
    setSections(sections.map((item) => item.key === section.key ? { ...item, ...partial } : item));
  }
  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <h1 className="font-serif text-3xl">{text(locale, "תוכנית", "Plan")}</h1>
        <nav className="mt-4 flex gap-2 overflow-auto lg:flex-col" aria-label={text(locale, "סעיפי התוכנית", "Plan sections")}>
          {sections.map((item) => (
            <button key={item.key} type="button" onClick={() => { setActive(item.key); setHistory([]); setMessage(null); }} className={cn("whitespace-nowrap px-3 py-2 text-start text-sm", item.key === section.key ? "bg-ink text-canvas" : "border border-line")}>
              {item.title}{item.locked ? " ·" : ""}
            </button>
          ))}
        </nav>
      </aside>
      <div className="lg:col-span-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input className="min-w-48 flex-1 bg-transparent font-serif text-3xl outline-none" value={section.title} onChange={(event) => patch({ title: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={section.locked} onChange={async (event) => {
              const locked = event.target.checked;
              patch({ locked });
              const result = await setSectionLockAction(bundle.id, section.key, locked);
              if (!result.ok) setMessage(result.error);
            }} />
            {text(locale, "נעילת העריכה שלי", "Lock my edit")}
          </label>
        </div>
        <SaveNote status={save.status} error={save.error} locale={locale} />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPreview((value) => !value)}>{preview ? text(locale, "עריכה", "Edit") : text(locale, "תצוגה", "Preview")}</Button>
          <Button type="button" variant="outline" size="sm" onClick={async () => {
            const result = await regenerateSectionAction(bundle.id, section.key, "preliminary");
            if (!result.ok) setMessage(result.error);
            else {
              patch({ content: result.content, title: result.title, origin: "preliminary" });
              setMessage(text(locale, "הסעיף רוענן כניתוח ראשוני.", "The section was refreshed as a preliminary analysis."));
            }
          }}>{text(locale, "רענון ראשוני", "Preliminary refresh")}</Button>
          <Button type="button" variant="outline" size="sm" disabled={!modelConfigured} onClick={async () => {
            const result = await regenerateSectionAction(bundle.id, section.key, "model");
            if (!result.ok) setMessage(result.error);
            else patch({ content: result.content, title: result.title, origin: "model" });
          }}>{modelConfigured ? text(locale, "רענון עם המודל", "Refresh with the model") : text(locale, "מודל לא מוגדר", "Model not configured")}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={async () => setHistory(await sectionHistory(bundle.id, section.key))}>{text(locale, "גרסאות", "Versions")}</Button>
        </div>
        {message && <p className="mt-3 text-sm" role="status">{message}</p>}
        {preview ? <div className="mt-4 border border-line bg-surface p-5"><MarkdownView source={section.content} /></div> : (
          <Textarea className="mt-4 min-h-[28rem]" value={section.content} onChange={(event) => patch({ content: event.target.value, origin: "user" })} />
        )}
        {history.length > 0 && (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{formatWhen(item.createdAt, locale)}</span>
                <button type="button" className="underline-offset-4 hover:underline" onClick={async () => {
                  const result = await restoreSectionAction(bundle.id, section.key, item.id);
                  if (!result.ok) setMessage(result.error);
                  else patch({ title: item.data.title, content: item.data.content, origin: "user" });
                }}>{text(locale, "שחזור", "Restore")}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
