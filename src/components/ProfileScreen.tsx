import { useMemo, useState } from "react"
import { Lock, Search } from "lucide-react"
import { badges } from "../data/badges"
import { searchGlossary } from "../data/glossary"
import { lessonOrder } from "../data/lessons"
import { checklistItems } from "../data/checklist"
import { cn, integer } from "../lib/format"
import { useProgress } from "../context/ProgressContext"
import { badgeIcons } from "./icons"
import { Button3D } from "./Button3D"

type Panel = "stats" | "badges" | "glossary"

export function ProfileScreen() {
  const { state, streak, earned, reset, seeTerm } = useProgress()
  const [panel, setPanel] = useState<Panel>("stats")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const results = useMemo(() => searchGlossary(query), [query])
  const earnedIds = new Set(earned.map((badge) => badge.id))
  const accuracy = state.answered === 0 ? null : Math.round((state.correctAnswers / state.answered) * 100)
  const lessonsDone = lessonOrder.filter((id) => state.completed[id]).length
  const checks = checklistItems.filter((item) => state.checklist[item.id]).length
  const name = state.displayName || "לומד"

  return (
    <div className="px-4 py-5">
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 place-items-center rounded-full border-b-4 border-duo-purple-dark bg-duo-purple text-2xl font-extrabold text-white">
          {name.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{name}</h1>
          <p className="text-sm font-bold text-muted">ההתקדמות נשמרת במכשיר הזה</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-line p-1">
        {(
          [
            ["stats", "נתונים"],
            ["badges", "תגים"],
            ["glossary", "מילון"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={panel === id}
            onClick={() => setPanel(id)}
            className={cn("rounded-xl py-2 text-sm font-extrabold", panel === id ? "bg-white text-ink" : "text-muted")}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "stats" && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat label="רצף" value={`${integer(streak)} ימים`} />
          <Stat label="ניסיון" value={integer(state.xp)} />
          <Stat label="שלבים" value={`${lessonsDone}/${lessonOrder.length}`} />
          <Stat label="דיוק" value={accuracy === null ? "עוד אין" : `${accuracy}%`} />
          <Stat label="יהלומים" value={integer(state.diamonds)} />
          <Stat label="צ׳ק-ליסט" value={`${checks}/${checklistItems.length}`} />
          <p className="col-span-2 text-sm leading-6 text-muted">
            דיוק מחושב מכל השאלות שעניתם, כולל תרגול. רצף עולה כשמשלימים שיעור ביום נוסף ברצף, לפי שעון ישראל.
          </p>
        </div>
      )}

      {panel === "badges" && (
        <ul className="mt-4 grid gap-2">
          {badges.map((badge) => {
            const owned = earnedIds.has(badge.id)
            const Icon = badgeIcons[badge.icon]
            return (
              <li key={badge.id} className={cn("flex items-center gap-3 rounded-2xl px-3 py-3", owned ? "bg-white" : "bg-white/60")}>
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", owned ? "bg-duo-yellow text-ink" : "bg-line text-muted")}>
                  {owned ? <Icon className="h-6 w-6" aria-hidden="true" /> : <Lock className="h-5 w-5" aria-hidden="true" />}
                </span>
                <span>
                  <span className="block font-extrabold">{badge.name}</span>
                  <span className="text-sm text-muted">{badge.description}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {panel === "glossary" && (
        <div className="mt-4">
          <label className="relative block">
            <span className="sr-only">חיפוש במילון</span>
            <Search className="pointer-events-none absolute top-1/2 start-3 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              dir="rtl"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="קרן השתלמות, נקודות זיכוי, תיאום מס..."
              className="w-full rounded-2xl border-2 border-line bg-white py-3 ps-10 pe-3 font-bold outline-none focus:border-duo-blue"
            />
          </label>
          {results.length === 0 ? (
            <p className="mt-4 text-sm font-bold text-muted">אין מושג כזה במילון. נסו «פנסיה», «פיקדון» או «ארנונה».</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {results.map((entry) => {
                const open = openId === entry.id
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => {
                        seeTerm(entry.id)
                        setOpenId(open ? null : entry.id)
                      }}
                      className="w-full rounded-2xl border-2 border-b-4 border-line bg-white px-3 py-3 text-right active:translate-y-1 active:border-b-0"
                    >
                      <span className="block font-extrabold">{entry.term}</span>
                      <span className="mt-1 block text-sm text-muted">{open ? entry.body : entry.summary}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <p className="mt-6 text-xs leading-5 text-muted">
        התוכן לימודי. סכומים וכללים מעודכנים ל-2026, והם לא מחליפים בדיקה מול רשות המסים, הביטוח הלאומי או חוזה שעומד לחתימה.
      </p>

      {confirmReset ? (
        <div className="mt-3 rounded-2xl bg-duo-red-soft p-3">
          <p className="text-sm font-bold">לאפס ניסיון, לבבות, צ׳ק-ליסט ומילון במכשיר הזה?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button3D tone="red" onClick={reset}>
              איפוס
            </Button3D>
            <Button3D tone="white" onClick={() => setConfirmReset(false)}>
              ביטול
            </Button3D>
          </div>
        </div>
      ) : (
        <button type="button" className="mt-3 text-sm font-bold text-muted underline" onClick={() => setConfirmReset(true)}>
          איפוס ההתקדמות
        </button>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-b-4 border-line bg-white px-3 py-3">
      <p className="text-xs font-bold text-muted">{label}</p>
      <p className="text-xl font-extrabold">{value}</p>
    </div>
  )
}
