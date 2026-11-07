"use client";

import { useRouter } from "next/navigation";
import { setPreferenceAction } from "@/server/actions";
import type { Locale } from "@/lib/domain";

export function Preferences({ locale, theme }: { locale: Locale; theme: "light" | "dark" }) {
  const router = useRouter();
  async function choose(kind: "locale" | "theme", value: string) {
    if (kind === "theme") document.documentElement.classList.toggle("dark", value === "dark");
    if (kind === "locale") document.documentElement.dir = value === "he" ? "rtl" : "ltr";
    await setPreferenceAction(kind, value);
    router.refresh();
  }
  const dark = theme === "dark";
  return (
    <div className="flex items-center gap-1 text-xs">
      <button type="button" className={locale === "he" ? "bg-accent px-2 py-1 text-ink" : "px-2 py-1 text-muted"} onClick={() => choose("locale", "he")}>עב</button>
      <button type="button" className={locale === "en" ? "bg-accent px-2 py-1 text-ink" : "px-2 py-1 text-muted"} onClick={() => choose("locale", "en")}>EN</button>
      <button
        type="button"
        className="px-2 py-1 text-muted"
        onClick={() => choose("theme", document.documentElement.classList.contains("dark") ? "light" : "dark")}
      >
        {dark ? (locale === "he" ? "בהיר" : "Light") : locale === "he" ? "כהה" : "Dark"}
      </button>
    </div>
  );
}
