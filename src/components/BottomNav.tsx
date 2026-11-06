import { Backpack, Map, UserRound } from "lucide-react"
import { cn } from "../lib/format"

export type Tab = "path" | "toolbox" | "profile"

const tabs: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "path", label: "מסלול", icon: Map },
  { id: "toolbox", label: "ארגז כלים", icon: Backpack },
  { id: "profile", label: "פרופיל", icon: UserRound },
]

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="grid grid-cols-3 border-t border-line bg-white px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1" aria-label="ניווט ראשי">
      {tabs.map((item) => {
        const Icon = item.icon
        const active = tab === item.id
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-bold",
              active ? "text-duo-blue" : "text-muted",
            )}
          >
            <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} aria-hidden="true" />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
