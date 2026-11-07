"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Wordmark } from "@/components/brand";
import { Preferences } from "@/components/preferences";
import { logoutAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { Locale } from "@/lib/domain";
import { cn } from "@/lib/utils";

const MAIN = [
  ["overview", "/app"],
  ["new", "/app/projects/new"],
  ["settings", "/app/settings"],
] as const;

const PROJECT = ["", "discovery", "plan", "brand", "website", "finance", "marketing", "roadmap", "export"] as const;

export function Shell({
  locale,
  theme,
  userName,
  projects,
  children,
}: {
  locale: Locale;
  theme: "light" | "dark";
  userName: string;
  projects: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const projectMatch = pathname.match(/^\/app\/projects\/(?!new$)([^/]+)/);
  const projectId = projectMatch?.[1];
  const labels: Record<string, string> = {
    overview: text(locale, "לוח בקרה", "Command center"),
    new: text(locale, "פרויקט חדש", "New project"),
    settings: text(locale, "הגדרות", "Settings"),
    "": text(locale, "סקירה", "Overview"),
    discovery: text(locale, "גילוי", "Discovery"),
    plan: text(locale, "תוכנית", "Plan"),
    brand: text(locale, "מותג", "Brand"),
    website: text(locale, "אתר", "Website"),
    finance: text(locale, "פיננסים", "Finance"),
    marketing: text(locale, "שיווק", "Marketing"),
    roadmap: text(locale, "מפת דרכים", "Roadmap"),
    export: text(locale, "ייצוא", "Export"),
  };
  const links = projectId
    ? PROJECT.map((key) => ({ href: key ? `/app/projects/${projectId}/${key}` : `/app/projects/${projectId}`, label: labels[key], exact: !key }))
    : MAIN.map(([key, href]) => ({ href, label: labels[key], exact: href === "/app" }));

  return (
    <div className="min-h-screen bg-canvas">
      <aside className={cn("fixed inset-y-0 start-0 z-30 w-64 bg-sidebar text-sidebar-ink", open ? "block" : "hidden lg:block")}>
        <div className="flex h-full flex-col px-4 py-5">
          <Link href="/app" onClick={() => setOpen(false)}><Wordmark light /></Link>
          <p className="mt-6 px-2 text-[11px] uppercase tracking-[0.16em] text-sidebar-muted">{projectId ? text(locale, "הפרויקט", "Project") : text(locale, "סטודיו", "Studio")}</p>
          <nav className="mt-2 flex flex-col gap-1" aria-label={text(locale, "ניווט", "Navigation")}>
            {links.map((link) => {
              const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={cn("px-3 py-2 text-sm", active ? "bg-accent text-ink" : "text-sidebar-ink hover:bg-white/5")}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
          {projects.length > 0 && (
            <div className="mt-8">
              <p className="px-2 text-[11px] uppercase tracking-[0.16em] text-sidebar-muted">{text(locale, "פרויקטים", "Projects")}</p>
              <div className="mt-2 flex max-h-48 flex-col gap-1 overflow-auto">
                {projects.map((project) => (
                  <Link key={project.id} href={`/app/projects/${project.id}`} onClick={() => setOpen(false)} className="truncate px-3 py-1.5 text-sm text-sidebar-muted hover:text-sidebar-ink">
                    {project.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-3 px-2 pt-6 text-sm">
            <span className="truncate text-sidebar-muted">{userName}</span>
            <form action={logoutAction}>
              <button className="text-sidebar-ink underline-offset-4 hover:underline" type="submit">{text(locale, "יציאה", "Log out")}</button>
            </form>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-20 bg-ink/40 lg:hidden" aria-label={text(locale, "סגירת תפריט", "Close menu")} onClick={() => setOpen(false)} />}
      <div className="lg:ps-64">
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 md:px-8">
          <button type="button" className="border border-line px-3 py-1.5 text-sm lg:hidden" onClick={() => setOpen(true)}>{text(locale, "תפריט", "Menu")}</button>
          <div className="ms-auto"><Preferences locale={locale} theme={theme} /></div>
        </header>
        <main id="content" className="px-4 py-8 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  );
}
