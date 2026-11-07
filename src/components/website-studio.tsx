"use client";

import { useState } from "react";
import { SaveNote } from "@/components/discovery-studio";
import { SitePreview } from "@/components/site-preview";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { applyBrandToSiteAction, publishAction, saveWebsiteAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { ProjectBundle, WebsiteSection } from "@/lib/domain";
import { useRouter } from "next/navigation";

export function WebsiteStudio({ bundle, publishEnabled }: { bundle: ProjectBundle; publishEnabled: boolean }) {
  const locale = bundle.profile.locale;
  const router = useRouter();
  const [site, setSite] = useState(bundle.website);
  const [selected, setSelected] = useState(site.sections[1]?.id ?? site.sections[0]?.id);
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  const [message, setMessage] = useState<string | null>(null);
  const section = site.sections.find((item) => item.id === selected) ?? site.sections[0];
  const save = useAutosave(JSON.stringify(site), () => saveWebsiteAction(bundle.id, site));
  function update(next: WebsiteSection) {
    setSite({ ...site, touched: true, sections: site.sections.map((item) => item.id === next.id ? next : item) });
  }
  function move(id: string, direction: -1 | 1) {
    const index = site.sections.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= site.sections.length) return;
    const sections = site.sections.slice();
    const [item] = sections.splice(index, 1);
    sections.splice(target, 0, item);
    setSite({ ...site, touched: true, sections });
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">{text(locale, "סטודיו אתר", "Website studio")}</h1>
          <p className="mt-2 text-sm text-muted">{text(locale, "התצוגה נבנית מסכימה שמורה. אין כאן הרצה של קוד שנוצר.", "The preview is built from a saved schema. Generated code is not executed.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={width === "desktop" ? "primary" : "outline"} onClick={() => setWidth("desktop")}>{text(locale, "מחשב", "Desktop")}</Button>
          <Button type="button" size="sm" variant={width === "mobile" ? "primary" : "outline"} onClick={() => setWidth("mobile")}>{text(locale, "טלפון", "Phone")}</Button>
          <Button type="button" size="sm" variant="outline" onClick={async () => {
            const result = await applyBrandToSiteAction(bundle.id);
            setMessage(result.ok ? text(locale, "הטיוטה הותאמה לכיוון. הגרסה הקודמת נשמרה בהיסטוריה.", "The draft was aligned to the direction. The previous version was snapshotted.") : result.error);
            if (result.ok) router.refresh();
          }}>{text(locale, "התאמה למותג", "Align to brand")}</Button>
          <Button type="button" size="sm" variant="outline" disabled={!publishEnabled} onClick={async () => {
            const result = await publishAction(bundle.id);
            setMessage(result.ok ? text(locale, "בקשת הפרסום נשלחה.", "The publish request was sent.") : result.error);
          }}>{publishEnabled ? text(locale, "פרסום", "Publish") : text(locale, "פרסום לא מוגדר", "Publishing is not configured")}</Button>
          <a className="inline-flex h-8 items-center border border-line px-3 text-sm" href={`/api/projects/${bundle.id}/export/website`}>{text(locale, "ייצוא קוד", "Export code")}</a>
        </div>
      </div>
      <SaveNote status={save.status} error={save.error} locale={locale} />
      {message && <p className="mt-3 text-sm">{message}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <ul className="divide-y divide-line border border-line bg-surface">
            {site.sections.map((item) => (
              <li key={item.id} className="flex items-center gap-2 px-3 py-2">
                <button type="button" className="flex-1 text-start text-sm" onClick={() => setSelected(item.id)}>{item.type}</button>
                <label className="text-xs text-muted"><input type="checkbox" checked={item.visible} onChange={(event) => update({ ...item, visible: event.target.checked })} /> {text(locale, "גלוי", "Visible")}</label>
                <button type="button" aria-label={text(locale, "למעלה", "Up")} onClick={() => move(item.id, -1)}>↑</button>
                <button type="button" aria-label={text(locale, "למטה", "Down")} onClick={() => move(item.id, 1)}>↓</button>
              </li>
            ))}
          </ul>
          {section && (
            <div className="mt-4 grid gap-2">
              {(["eyebrow", "title", "subtitle", "body", "button"] as const).map((key) => (
                <label key={key} className="text-sm text-muted">
                  {key}
                  {key === "body" || key === "subtitle" ? (
                    <Textarea className="mt-1" value={section.content[key] ?? ""} onChange={(event) => update({ ...section, content: { ...section.content, [key]: event.target.value } })} />
                  ) : (
                    <Input className="mt-1" value={section.content[key] ?? ""} onChange={(event) => update({ ...section, content: { ...section.content, [key]: event.target.value } })} />
                  )}
                </label>
              ))}
              {section.type === "hero" && (
                <>
                  <label className="text-sm text-muted">{text(locale, "טיפול ויזואלי", "Visual treatment")}
                    <select className="mt-1 h-11 w-full border border-line bg-surface px-3" value={section.content.image ?? "none"} onChange={(event) => update({ ...section, content: { ...section.content, image: event.target.value as "none" | "wash" | "grid" | "custom" } })}>
                      <option value="none">{text(locale, "בלי תמונה", "No image")}</option>
                      <option value="wash">{text(locale, "שטיפת צבע", "Color wash")}</option>
                      <option value="grid">{text(locale, "רשת", "Grid")}</option>
                      <option value="custom">{text(locale, "כתובת תמונה", "Image URL")}</option>
                    </select>
                  </label>
                  {section.content.image === "custom" && <Input value={section.content.imageUrl ?? ""} placeholder="https://" onChange={(event) => update({ ...section, content: { ...section.content, imageUrl: event.target.value } })} />}
                </>
              )}
              {(section.content.items ?? []).map((item, index) => (
                <div key={`${section.id}-${index}`} className="grid gap-1 border border-line p-2">
                  <Input value={item.title} onChange={(event) => {
                    const items = section.content.items!.slice();
                    items[index] = { ...item, title: event.target.value };
                    update({ ...section, content: { ...section.content, items } });
                  }} />
                  <Textarea value={item.text} onChange={(event) => {
                    const items = section.content.items!.slice();
                    items[index] = { ...item, text: event.target.value };
                    update({ ...section, content: { ...section.content, items } });
                  }} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                {(["background", "surface", "text", "accent"] as const).map((key) => (
                  <label key={key} className="text-xs text-muted">{key}
                    <input type="color" className="mt-1 block h-9 w-full" value={site.theme[key]} onChange={(event) => setSite({ ...site, touched: true, theme: { ...site.theme, [key]: event.target.value } })} />
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="overflow-auto lg:col-span-8">
          <SitePreview site={site} locale={locale} width={width} />
        </div>
      </div>
    </div>
  );
}
