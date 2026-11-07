"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { deleteProjectAction, saveProfileAction } from "@/server/actions";
import { text, tierLabel } from "@/lib/consultant/shared";
import type { ProjectBundle } from "@/lib/domain";
import { PRICING_TIERS, CURRENCIES } from "@/lib/domain";
import { projectStatus } from "@/lib/progress";
import { formatMoney } from "@/lib/format";

export function Overview({ bundle }: { bundle: ProjectBundle }) {
  const locale = bundle.profile.locale;
  const status = projectStatus(bundle);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p className="text-sm text-muted">{bundle.analysis.mode === "model" ? text(locale, "תוכנית בעזרת מודל. המספרים מחושבים מקומית.", "Plan assisted by a model. Numbers are calculated locally.") : text(locale, "ניתוח ראשוני. אין מודל חי מאחורי הטיוטה הזו.", "Preliminary analysis. No live model sits behind this draft.")}</p>
        <h1 className="mt-2 font-serif text-4xl md:text-5xl">{bundle.name}</h1>
        <p className="mt-4 text-lg leading-relaxed" dir="auto">{bundle.analysis.opportunity}</p>
        <div className="mt-8 border border-line bg-surface p-5">
          <p className="text-sm text-muted">{text(locale, "הצעד הבא", "Next step")}</p>
          <Link href={status.nextHref} className="mt-2 block font-serif text-2xl underline-offset-4 hover:underline">{status.nextLabel}</Link>
        </div>
        <form
          className="mt-8 grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              const result = await saveProfileAction(bundle.id, {
                name: String(data.get("name") ?? ""),
                location: String(data.get("location") ?? ""),
                audience: String(data.get("audience") ?? ""),
                goals: String(data.get("goals") ?? ""),
                budget: Number(data.get("budget") ?? 0),
                currency: String(data.get("currency")) as "ILS" | "USD" | "EUR",
                pricingTier: String(data.get("pricingTier")) as "value" | "mid" | "premium" | "luxury",
              });
              if (!result.ok) setError(result.error);
              else router.refresh();
            });
          }}
        >
          <h2 className="font-serif text-2xl">{text(locale, "פרופיל שנשמר", "Saved profile")}</h2>
          <p className="text-sm text-muted">{text(locale, "שינוי כאן לא מוחק תוכן שכבר נכתב. הרענון הבא ישתמש בערכים החדשים.", "A change here does not erase content already written. The next refresh uses the new values.")}</p>
          <div>
            <Label htmlFor="name">{text(locale, "שם הפרויקט", "Project name")}</Label>
            <Input id="name" name="name" defaultValue={bundle.name} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="location">{text(locale, "מיקום", "Location")}</Label>
              <Input id="location" name="location" defaultValue={bundle.profile.location} />
            </div>
            <div>
              <Label htmlFor="audience">{text(locale, "קהל", "Audience")}</Label>
              <Input id="audience" name="audience" defaultValue={bundle.profile.audience} />
            </div>
            <div>
              <Label htmlFor="budget">{text(locale, "תקציב", "Budget")}</Label>
              <Input id="budget" name="budget" type="number" min={0} defaultValue={bundle.profile.budget} />
            </div>
            <div>
              <Label htmlFor="currency">{text(locale, "מטבע", "Currency")}</Label>
              <Select id="currency" name="currency" defaultValue={bundle.profile.currency}>{CURRENCIES.map((code) => <option key={code}>{code}</option>)}</Select>
            </div>
          </div>
          <div>
            <Label htmlFor="pricingTier">{text(locale, "רמת מחיר", "Price level")}</Label>
            <Select id="pricingTier" name="pricingTier" defaultValue={bundle.profile.pricingTier}>
              {PRICING_TIERS.map((tier) => <option key={tier} value={tier}>{tierLabel(tier, locale)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="goals">{text(locale, "יעד", "Goal")}</Label>
            <Input id="goals" name="goals" defaultValue={bundle.profile.goals} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={pending}>{text(locale, "שמירת פרופיל", "Save profile")}</Button>
        </form>
      </div>
      <aside className="lg:col-span-5">
        <p className="text-sm text-muted">{text(locale, "התקדמות", "Progress")} <span className="num">{status.percent}%</span></p>
        <div className="mt-2 h-1 bg-line"><div className="h-1 bg-ink" style={{ width: `${status.percent}%` }} /></div>
        <ul className="mt-6 divide-y divide-line border-y border-line">
          {status.modules.map((module) => (
            <li key={module.key}>
              <Link href={module.href} className="flex items-baseline justify-between gap-4 py-3">
                <span>{module.label}</span>
                <span className="text-sm text-muted">{module.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">{text(locale, "תקציב שהוזן או הערכה:", "Entered budget or estimate:")} <span className="num">{formatMoney(bundle.profile.budget, bundle.profile.currency, locale)}</span></p>
        {confirming ? (
          <div className="mt-8 border border-danger/40 p-4">
            <p>{text(locale, "למחוק את הפרויקט וכל מה שנשמר בו?", "Delete the project and everything saved in it?")}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="danger" type="button" onClick={() => start(async () => { await deleteProjectAction(bundle.id); })}>{text(locale, "מחיקה", "Delete")}</Button>
              <Button variant="outline" type="button" onClick={() => setConfirming(false)}>{text(locale, "ביטול", "Cancel")}</Button>
            </div>
          </div>
        ) : (
          <button type="button" className="mt-8 text-sm text-danger" onClick={() => setConfirming(true)}>{text(locale, "מחיקת פרויקט", "Delete project")}</button>
        )}
      </aside>
    </div>
  );
}
