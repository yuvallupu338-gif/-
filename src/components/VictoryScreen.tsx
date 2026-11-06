import { useEffect, useRef, useState, type ReactNode } from "react"
import { animate, useReducedMotion } from "framer-motion"
import { Gem, Trophy, Zap } from "lucide-react"
import { lessonById } from "../data/lessons"
import type { Badge } from "../data/badges"
import { integer } from "../lib/format"
import type { LessonReward } from "../lib/progress"
import { useProgress } from "../context/ProgressContext"
import { badgeIcons } from "./icons"
import { Button3D } from "./Button3D"
import { Confetti } from "./Confetti"

export function VictoryScreen({
  lessonId,
  correct,
  total,
  reward,
  newBadges,
  onDone,
}: {
  lessonId: string
  correct: number
  total: number
  reward: LessonReward
  newBadges: Badge[]
  onDone: () => void
}) {
  const lesson = lessonById(lessonId)
  const { celebrate } = useProgress()
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    if (newBadges.length) celebrate(newBadges.map((badge) => badge.id))
  }, [celebrate, newBadges])

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-5 py-8">
      <Confetti />
      <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-full border-b-4 border-duo-yellow-dark bg-duo-yellow text-ink">
        <Trophy className="h-12 w-12" aria-hidden="true" />
      </div>
      <h1 className="relative mt-4 text-center text-3xl font-extrabold">{reward.practice ? "תרגול הושלם" : "שיעור הושלם"}</h1>
      <p className="relative mt-1 text-center font-bold text-muted">{lesson?.title}</p>
      <p className="relative mt-3 text-center text-lg font-extrabold">
        {reward.perfect ? "בלי אף מוקש" : `${correct} תשובות נכונות מתוך ${total}`}
      </p>

      <div className="relative mt-6 grid grid-cols-2 gap-3">
        <RewardCard icon={<Zap className="h-5 w-5 text-duo-yellow" />} label="ניסיון" value={reward.xpGained} />
        <RewardCard icon={<Gem className="h-5 w-5 text-duo-blue" />} label="יהלומים" value={reward.diamondsGained} />
      </div>

      <ul className="relative mt-4 space-y-1 text-sm font-bold text-muted">
        <li>+{integer(reward.answerXp)} על תשובות נכונות</li>
        {reward.finishXp > 0 && <li>+{integer(reward.finishXp)} על סיום השיעור</li>}
        {reward.perfectXp > 0 && <li>+{integer(reward.perfectXp)} בונוס על שיעור מושלם</li>}
        {reward.heartRestored && <li>חזר לב אחד על סיום השיעור</li>}
        {reward.practice && <li>בתרגול אין יהלומים נוספים, והלבבות נשארים במקום</li>}
      </ul>

      {newBadges.length > 0 && (
        <div className="relative mt-5">
          <h2 className="font-extrabold">תגים חדשים</h2>
          <ul className="mt-2 grid gap-2">
            {newBadges.map((badge) => {
              const Icon = badgeIcons[badge.icon]
              return (
                <li key={badge.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-duo-yellow text-ink">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-extrabold">{badge.name}</span>
                    <span className="text-sm text-muted">{badge.description}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <Button3D className="relative mt-auto" full onClick={onDone}>
        להמשך המסלול
      </Button3D>
    </div>
  )
}

function RewardCard({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border-2 border-b-4 border-line bg-white px-3 py-4 text-center">
      <div className="flex items-center justify-center gap-1 font-bold text-muted">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-3xl font-extrabold">
        <CountUp value={value} />
      </p>
    </div>
  )
}

function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) return
    const controls = animate(0, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (next) => setShown(Math.round(next)),
    })
    return () => controls.stop()
  }, [reduce, value])
  return <span dir="ltr">{integer(shown)}</span>
}
