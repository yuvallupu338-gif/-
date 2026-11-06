import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Lock, Sparkles } from "lucide-react"
import { lessonOrder, worlds } from "../data/lessons"
import { useProgress } from "../context/ProgressContext"
import { cn } from "../lib/format"
import { lessonIcons } from "./icons"

const nodeTone = {
  green: "border-duo-green-dark bg-duo-green text-white",
  blue: "border-duo-blue-dark bg-duo-blue text-white",
  purple: "border-duo-purple-dark bg-duo-purple text-white",
}

const bannerTone = {
  green: "bg-duo-green-soft",
  blue: "bg-duo-blue-soft",
  purple: "bg-duo-purple-soft",
}

const lineTone = {
  green: "bg-duo-green",
  blue: "bg-duo-blue",
  purple: "bg-duo-purple",
}

export function PathScreen({ onOpen }: { onOpen: (lessonId: string) => void }) {
  const { state } = useProgress()
  const [toast, setToast] = useState<string | null>(null)
  const completedCount = lessonOrder.filter((id) => state.completed[id]).length
  const currentId = lessonOrder.find((id) => !state.completed[id]) ?? null
  const greeting = state.displayName ? `היי, ${state.displayName}` : "היי"

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border-b-4 border-duo-green-dark bg-duo-green text-2xl font-extrabold text-white">
          ב
        </div>
        <div>
          <p className="text-sm font-bold text-muted">{greeting}</p>
          <h1 className="text-2xl font-extrabold leading-none">בוגרים</h1>
        </div>
      </div>
      <p className="mb-3 text-sm leading-6 text-muted">תלוש, חוזה וזכויות. בקצרה, ובגובה העיניים.</p>
      <div className="mb-6">
        <div className="mb-1 flex justify-between text-xs font-bold text-muted">
          <span>התקדמות במסלול</span>
          <span>
            {completedCount} מתוך {lessonOrder.length}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={completedCount} aria-valuemax={lessonOrder.length} aria-label="שלבים שהושלמו">
          <div className="h-full rounded-full bg-duo-green" style={{ width: `${(completedCount / lessonOrder.length) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-8">
        {worlds.map((world) => {
          const done = world.lessons.filter((lesson) => state.completed[lesson.id]).length
          return (
            <section key={world.id} aria-labelledby={`world-${world.id}`}>
              <div className={cn("rounded-3xl px-4 py-3", bannerTone[world.tone])}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 id={`world-${world.id}`} className="text-lg font-extrabold">
                      {world.title}
                    </h2>
                    <p className="text-sm font-medium text-ink/70">{world.subtitle}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold">
                    {done}/{world.lessons.length}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex flex-col items-center">
                {world.lessons.map((lesson, index) => {
                  const orderIndex = lessonOrder.indexOf(lesson.id)
                  const unlocked = orderIndex === 0 || Boolean(state.completed[lessonOrder[orderIndex - 1]])
                  const completed = state.completed[lesson.id]
                  const current = lesson.id === currentId
                  const Icon = lessonIcons[lesson.icon]
                  return (
                    <div key={lesson.id} className="flex w-full flex-col items-center">
                      {index > 0 && (
                        <div className={cn("h-8 w-2 rounded-full", state.completed[world.lessons[index - 1].id] ? lineTone[world.tone] : "bg-line")} />
                      )}
                      <motion.button
                        type="button"
                        id={current ? "current-lesson" : undefined}
                        initial={{ scale: 0.92, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!unlocked) {
                            setToast("קודם מסיימים את השלב הפתוח")
                            return
                          }
                          onOpen(lesson.id)
                        }}
                        aria-label={`${lesson.title}${completed ? ", הושלם" : unlocked ? "" : ", נעול"}`}
                        className={cn(
                          "relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border-b-4 transition-transform",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-duo-blue",
                          unlocked ? nodeTone[world.tone] : "border-[#d0d0d0] bg-[#e5e5e5] text-[#9a9a9a]",
                          current && "ring-4 ring-white ring-offset-4 ring-offset-duo-yellow",
                          unlocked && "active:translate-y-1 active:border-b-0",
                        )}
                      >
                        {completed?.perfect && (
                          <Sparkles className="absolute -top-1 -left-1 h-5 w-5 fill-duo-yellow text-duo-yellow" aria-hidden="true" />
                        )}
                        {completed ? <Check className="h-8 w-8" /> : unlocked ? <Icon className="h-7 w-7" /> : <Lock className="h-6 w-6" />}
                        {current && (
                          <motion.span
                            className="absolute -top-9 rounded-xl border-2 border-b-4 border-duo-yellow-dark bg-duo-yellow px-2 py-0.5 text-xs font-extrabold text-ink"
                            animate={{ y: [0, -3, 0] }}
                            transition={{ repeat: Infinity, duration: 1.3 }}
                          >
                            התחל
                          </motion.span>
                        )}
                      </motion.button>
                      <p className={cn("mt-2 max-w-40 text-center text-sm font-extrabold", unlocked ? "text-ink" : "text-muted")}>
                        {lesson.title}
                      </p>
                      <p className="mb-1 max-w-48 text-center text-xs text-muted">{lesson.subtitle}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {toast && (
        <div className="pointer-events-none sticky bottom-3" role="status">
          <p className="mx-auto w-fit rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  )
}
