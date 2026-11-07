"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { shareAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { ProjectBundle } from "@/lib/domain";
import { formatWhen } from "@/lib/format";
import { useRouter } from "next/navigation";

const KINDS = [
  ["plan", "תוכנית PDF", "Plan PDF"],
  ["brand", "מותג PDF", "Brand PDF"],
  ["finance", "פיננסים CSV", "Finance CSV"],
  ["calendar", "לוח שיווק CSV", "Calendar CSV"],
  ["website", "קוד אתר ZIP", "Website ZIP"],
  ["summary", "סיכום Markdown", "Summary Markdown"],
] as const;

export function ExportPanel({ bundle, exportsList }: { bundle: ProjectBundle; exportsList: { kind: string; createdAt: string }[] }) {
  const locale = bundle.profile.locale;
  const router = useRouter();
  const [token, setToken] = useState(bundle.shareRevoked ? "" : bundle.shareToken ?? "");
  const [error, setError] = useState<string | null>(null);
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-4xl">{text(locale, "ייצוא", "Export")}</h1>
      <p className="mt-3 text-sm text-muted">{text(locale, "הקבצים נבנים מהתוכן השמור, לא מתבנית ריקה.", "Files are built from saved content, not from an empty template.")}</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {KINDS.map(([kind, he, en]) => (
          <li key={kind} className="flex items-center justify-between gap-3 py-4">
            <span>{text(locale, he, en)}</span>
            <a className="border border-line px-3 py-2 text-sm" href={`/api/projects/${bundle.id}/export/${kind}`}>{text(locale, "הורדה", "Download")}</a>
          </li>
        ))}
      </ul>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">{text(locale, "שיתוף לקריאה", "Read-only sharing")}</h2>
        <p className="mt-2 text-sm text-muted">{text(locale, "הקישור מציג את הפרויקט בלי עריכה. אפשר לבטל אותו.", "The link shows the project without editing. You can revoke it.")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={async () => {
            const result = await shareAction(bundle.id, true);
            if (!result.ok) setError(result.error);
            else { setToken(result.token ?? token); router.refresh(); }
          }}>{text(locale, "יצירת קישור", "Create link")}</Button>
          <Button type="button" variant="outline" onClick={async () => {
            const result = await shareAction(bundle.id, false);
            if (!result.ok) setError(result.error);
            else { setToken(""); router.refresh(); }
          }}>{text(locale, "ביטול", "Revoke")}</Button>
        </div>
        {token && <p className="mt-3 break-all text-sm" dir="ltr">{origin}/share/{token}</p>}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </section>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">{text(locale, "הורדות אחרונות", "Recent downloads")}</h2>
        {exportsList.length === 0 ? <p className="mt-2 text-sm text-muted">{text(locale, "עדיין לא הורדתם קובץ.", "No file has been downloaded yet.")}</p> : (
          <ul className="mt-3 text-sm text-muted">
            {exportsList.map((item) => <li key={item.createdAt + item.kind}>{item.kind} · {formatWhen(item.createdAt, locale)}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
