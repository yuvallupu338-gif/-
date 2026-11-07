"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConceptLogo } from "@/components/brand";
import { SaveNote } from "@/components/discovery-studio";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { generateBrandImageAction, moreNamesAction, saveBrandAction, selectBrandAction } from "@/server/actions";
import { initials, text } from "@/lib/consultant/shared";
import type { BrandDirection, ProjectBundle } from "@/lib/domain";
import { cn } from "@/lib/utils";

const FONTS = ["Frank Ruhl Libre", "Heebo", "Rubik", "Assistant"];

export function BrandStudio({ bundle, imageEnabled }: { bundle: ProjectBundle; imageEnabled: boolean }) {
  const locale = bundle.profile.locale;
  const router = useRouter();
  const [brands, setBrands] = useState(bundle.brands);
  const [selected, setSelected] = useState(bundle.selectedBrandId);
  const [message, setMessage] = useState<string | null>(null);
  const save = useAutosave(JSON.stringify(brands), async () => {
    for (const brand of brands) {
      const result = await saveBrandAction(bundle.id, brand);
      if (!result.ok) return result;
    }
    return { ok: true };
  });
  function patch(id: string, partial: Partial<BrandDirection>) {
    setBrands(brands.map((brand) => brand.id === id ? { ...brand, ...partial } : brand));
  }
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl">{text(locale, "סטודיו מותג", "Brand studio")}</h1>
      <p className="mt-3 max-w-2xl text-muted">{brands[0]?.trademarkNote}</p>
      <p className="mt-2 text-sm text-muted">{imageEnabled ? text(locale, "אפשר לבקש תמונת לוגו. היא תישמר רק אם השירות יענה.", "You can request a logo image. It is saved only if the service responds.") : text(locale, "יצירת תמונה לא מופעלת. הסקיצות הן פריסות לעריכה, לא תמונות שנוצרו.", "Image generation is off. The sketches are editable layouts, not generated images.")}</p>
      <SaveNote status={save.status} error={save.error} locale={locale} />
      {message && <p className="mt-3 text-sm">{message}</p>}
      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        {brands.map((brand) => {
          const ink = brand.colors[1]?.hex ?? "#171917";
          const paper = brand.colors[0]?.hex ?? "#F7F4EE";
          const accent = brand.colors[2]?.hex ?? "#CEF46A";
          const active = selected === brand.id;
          return (
            <article key={brand.id} className={cn("border bg-surface p-4", active ? "border-ink" : "border-line")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-2xl">{brand.title}</h2>
                {active && <span className="bg-accent px-2 py-1 text-xs text-ink">{text(locale, "נבחר", "Selected")}</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{brand.summary}</p>
              <div className="mt-4" style={{ background: paper }}>
                <ConceptLogo name={brand.chosenName} initials={brand.logo.initials} style={brand.logo.style} ink={ink} accent={accent} paper={paper} />
              </div>
              {brand.generatedImage && (
                <Image
                  src={brand.generatedImage}
                  alt={text(locale, `סקיצת לוגו עבור ${brand.chosenName}`, `Logo sketch for ${brand.chosenName}`)}
                  width={640}
                  height={640}
                  unoptimized
                  className="mt-3 h-auto w-full border border-line"
                />
              )}
              <Input className="mt-4" value={brand.chosenName} onChange={(event) => patch(brand.id, { chosenName: event.target.value, logo: { ...brand.logo, initials: initials(event.target.value) } })} aria-label={text(locale, "שם", "Name")} />
              <Input className="mt-2" value={brand.tagline} onChange={(event) => patch(brand.id, { tagline: event.target.value })} aria-label={text(locale, "שורה", "Line")} />
              <Textarea className="mt-2 min-h-28" value={brand.positioning} onChange={(event) => patch(brand.id, { positioning: event.target.value })} />
              <div className="mt-3 flex flex-wrap gap-2">
                {brand.colors.map((color, index) => (
                  <label key={color.hex + index} className="text-xs text-muted">
                    {color.name}
                    <input type="color" className="mt-1 block h-9 w-12 border border-line bg-surface" value={color.hex} onChange={(event) => {
                      const colors = brand.colors.slice();
                      colors[index] = { ...color, hex: event.target.value };
                      patch(brand.id, { colors });
                    }} />
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select className="h-10 border border-line bg-surface px-2 text-sm" value={brand.fonts.heading} onChange={(event) => patch(brand.id, { fonts: { ...brand.fonts, heading: event.target.value } })}>
                  {FONTS.map((font) => <option key={font}>{font}</option>)}
                </select>
                <select className="h-10 border border-line bg-surface px-2 text-sm" value={brand.fonts.body} onChange={(event) => patch(brand.id, { fonts: { ...brand.fonts, body: event.target.value } })}>
                  {FONTS.map((font) => <option key={font}>{font}</option>)}
                </select>
              </div>
              <select className="mt-2 h-10 w-full border border-line bg-surface px-2 text-sm" value={brand.logo.style} onChange={(event) => patch(brand.id, { logo: { ...brand.logo, style: event.target.value as BrandDirection["logo"]["style"] } })}>
                <option value="wordmark">Wordmark</option>
                <option value="seal">Seal</option>
                <option value="monogram">Monogram</option>
                <option value="bar">Bar</option>
              </select>
              <ul className="mt-3 space-y-1 text-sm">
                {brand.names.map((item) => (
                  <li key={item.name}>
                    <button type="button" className="text-start underline-offset-4 hover:underline" onClick={() => patch(brand.id, { chosenName: item.name, logo: { ...brand.logo, initials: initials(item.name) } })}>{item.name}</button>
                    <span className="text-muted"> · {item.note}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={async () => {
                  const result = await selectBrandAction(bundle.id, brand.id);
                  if (!result.ok) setMessage(result.error);
                  else { setSelected(brand.id); router.refresh(); }
                }}>{text(locale, "בחירה בכיוון", "Choose this direction")}</Button>
                <Button type="button" size="sm" variant="outline" onClick={async () => {
                  const result = await moreNamesAction(bundle.id, brand.id);
                  if (!result.ok) setMessage(result.error);
                  else router.refresh();
                }}>{text(locale, "שמות נוספים", "More names")}</Button>
                <Button type="button" size="sm" variant="outline" disabled={!imageEnabled} onClick={async () => {
                  const result = await generateBrandImageAction(bundle.id, brand.id);
                  setMessage(result.ok ? text(locale, "התמונה נשמרה.", "The image was saved.") : result.error);
                  if (result.ok) router.refresh();
                }}>{text(locale, "תמונת לוגו", "Logo image")}</Button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
