"use client";

import { useState } from "react";
import { SaveNote } from "@/components/discovery-studio";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { saveMarketingAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { CalendarItem, ProjectBundle } from "@/lib/domain";

export function MarketingStudio({ bundle }: { bundle: ProjectBundle }) {
  const locale = bundle.profile.locale;
  const [assets, setAssets] = useState(bundle.marketing);
  const [calendar, setCalendar] = useState(bundle.calendar);
  const [copied, setCopied] = useState<string | null>(null);
  const save = useAutosave(JSON.stringify({ assets, calendar }), () => saveMarketingAction(bundle.id, assets.map(({ id, title, content }) => ({ id, title, content })), calendar));
  async function copy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(id);
  }
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-4xl">{text(locale, "סטודיו שיווק", "Marketing studio")}</h1>
      <p className="mt-3 text-sm text-muted">{text(locale, "טיוטות לפי הפרופיל והמותג. ערכו והעתיקו. אין כאן ביצועי קמפיין.", "Drafts from the profile and brand. Edit and copy them. There are no campaign results here.")}</p>
      <SaveNote status={save.status} error={save.error} locale={locale} />
      <div className="mt-8 grid gap-6">
        {assets.map((asset) => (
          <article key={asset.id} className="border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <Input value={asset.title} onChange={(event) => setAssets(assets.map((item) => item.id === asset.id ? { ...item, title: event.target.value } : item))} />
              <Button type="button" size="sm" variant="outline" onClick={() => copy(asset.id, asset.content)}>{copied === asset.id ? text(locale, "הועתק", "Copied") : text(locale, "העתקה", "Copy")}</Button>
            </div>
            <Textarea className="mt-3 min-h-40" value={asset.content} onChange={(event) => setAssets(assets.map((item) => item.id === asset.id ? { ...item, content: event.target.value } : item))} />
          </article>
        ))}
      </div>
      <h2 className="mt-10 font-serif text-2xl">{text(locale, "לוח 30 יום", "30-day calendar")}</h2>
      <div className="mt-4 overflow-auto border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-canvas text-muted"><tr><th className="px-3 py-2 text-start">#</th><th className="px-3 py-2 text-start">{text(locale, "ערוץ", "Channel")}</th><th className="px-3 py-2 text-start">{text(locale, "רעיון", "Concept")}</th><th className="px-3 py-2 text-start">{text(locale, "טקסט", "Caption")}</th></tr></thead>
          <tbody>
            {calendar.map((item) => (
              <tr key={item.id} className="border-t border-line">
                <td className="px-3 py-2 num">{item.day}</td>
                <td className="px-2 py-2"><Cell item={item} field="channel" onChange={(next) => setCalendar(replace(calendar, next))} /></td>
                <td className="px-2 py-2"><Cell item={item} field="concept" onChange={(next) => setCalendar(replace(calendar, next))} /></td>
                <td className="px-2 py-2"><Cell item={item} field="caption" onChange={(next) => setCalendar(replace(calendar, next))} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <a className="mt-4 inline-flex text-sm underline-offset-4 hover:underline" href={`/api/projects/${bundle.id}/export/calendar`}>{text(locale, "הורדת CSV", "Download CSV")}</a>
    </div>
  );
}

function replace(items: CalendarItem[], next: CalendarItem) {
  return items.map((item) => item.id === next.id ? next : item);
}

function Cell({ item, field, onChange }: { item: CalendarItem; field: "channel" | "concept" | "caption"; onChange: (item: CalendarItem) => void }) {
  return <input className="w-full bg-transparent outline-none" value={item[field]} onChange={(event) => onChange({ ...item, [field]: event.target.value })} />;
}
