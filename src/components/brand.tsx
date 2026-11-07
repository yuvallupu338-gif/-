import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} aria-hidden>
      <rect width="32" height="32" className="fill-ink dark:fill-accent" />
      <rect x="7" y="7" width="18" height="3.5" className="fill-accent dark:fill-ink" />
      <rect x="7" y="7" width="3.5" height="18" className="fill-accent dark:fill-ink" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-[15px] tracking-tight", light ? "text-sidebar-ink" : "text-ink")}>
      <Mark className={light ? "[&_rect:first-child]:fill-accent [&_rect:not(:first-child)]:fill-ink" : undefined} />
      <span className="font-medium">LaunchLab</span>
    </span>
  );
}

export function ConceptLogo({
  name,
  initials,
  style,
  ink,
  accent,
  paper,
}: {
  name: string;
  initials: string;
  style: "wordmark" | "seal" | "monogram" | "bar";
  ink: string;
  accent: string;
  paper: string;
}) {
  if (style === "seal") {
    return (
      <svg viewBox="0 0 200 200" className="h-36 w-36" role="img" aria-label={name}>
        <circle cx="100" cy="100" r="92" fill={ink} />
        <circle cx="100" cy="100" r="76" fill="none" stroke={accent} strokeWidth="3" />
        <text x="100" y="112" textAnchor="middle" fontSize="48" fill={accent} fontFamily="Heebo, sans-serif">{initials}</text>
      </svg>
    );
  }
  if (style === "monogram") {
    return (
      <div className="grid h-36 w-36 place-items-center border" style={{ background: paper, color: ink, borderColor: ink }}>
        <span className="font-serif text-5xl leading-none">{initials}</span>
      </div>
    );
  }
  if (style === "bar") {
    return (
      <div className="flex h-36 w-full max-w-xs flex-col justify-end gap-3 px-1" style={{ color: ink }}>
        <div className="h-1.5 w-16" style={{ background: accent }} />
        <div className="font-serif text-3xl leading-none">{name}</div>
      </div>
    );
  }
  return (
    <div className="flex h-36 items-end" style={{ color: ink }}>
      <div>
        <div className="mb-3 h-1.5 w-10" style={{ background: accent }} />
        <div className="font-serif text-4xl leading-none">{name}</div>
      </div>
    </div>
  );
}
