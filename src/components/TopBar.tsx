import { useState, type ReactNode } from "react"
import { Flame, Gem, Heart, Zap } from "lucide-react"
import { ECONOMY } from "../lib/progress"
import { integer } from "../lib/format"
import { useProgress } from "../context/ProgressContext"
import { HeartsDialog } from "./HeartsDialog"

export function TopBar({ interactive = true }: { interactive?: boolean }) {
  const { state, streak } = useProgress()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between gap-2 border-b border-line bg-white px-3 py-2.5">
        <Stat label={`רצף: ${streak} ימים`} value={integer(streak)} icon={<Flame className="h-4 w-4 text-duo-orange" />} />
        <Stat label={`יהלומים: ${state.diamonds}`} value={integer(state.diamonds)} icon={<Gem className="h-4 w-4 text-duo-blue" />} />
        <Stat label={`נקודות ניסיון: ${state.xp}`} value={integer(state.xp)} icon={<Zap className="h-4 w-4 text-duo-yellow" />} />
        <button
          type="button"
          className="flex items-center gap-0.5 rounded-xl px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-duo-blue disabled:cursor-default"
          aria-label={`${state.hearts} לבבות מתוך ${ECONOMY.maxHearts}`}
          disabled={!interactive}
          onClick={() => setOpen(true)}
        >
          {Array.from({ length: ECONOMY.maxHearts }, (_, index) => (
            <Heart
              key={index}
              className={index < state.hearts ? "h-4 w-4 fill-duo-red text-duo-red" : "h-4 w-4 text-line"}
              aria-hidden="true"
            />
          ))}
        </button>
      </header>
      <HeartsDialog open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-1 text-sm font-extrabold text-ink" aria-label={label}>
      {icon}
      <span dir="ltr">{value}</span>
    </div>
  )
}
