import { useState } from "react"
import { ArrowRight, Calculator, ClipboardCheck, Home } from "lucide-react"
import { checklist, checklistItems } from "../data/checklist"
import { calculatePay, CREDIT_POINT_NIS } from "../lib/tax"
import { cn, integer, pointsLabel, shekel } from "../lib/format"
import { useProgress } from "../context/ProgressContext"
import { Button3D } from "./Button3D"

type Tool = "menu" | "checklist" | "calculator"

const sliceColor = {
  green: "bg-duo-green",
  red: "bg-duo-red",
  blue: "bg-duo-blue",
  teal: "bg-[#14b8a6]",
  purple: "bg-duo-purple",
  yellow: "bg-duo-yellow",
}

export function ToolboxScreen() {
  const [tool, setTool] = useState<Tool>("menu")
  if (tool === "checklist") return <Checklist onBack={() => setTool("menu")} />
  if (tool === "calculator") return <PayCalculator onBack={() => setTool("menu")} />

  return (
    <div className="px-4 py-5">
      <h1 className="text-2xl font-extrabold">ארגז כלים</h1>
      <p className="mt-1 text-sm leading-6 text-muted">שני כלים ליום שבו עוברים דירה או קוראים תלוש ראשון.</p>
      <div className="mt-4 grid gap-3">
        <button type="button" onClick={() => setTool("checklist")} className="rounded-3xl border-2 border-b-4 border-duo-blue-dark bg-duo-blue p-4 text-right text-white active:translate-y-1 active:border-b-0">
          <ClipboardCheck className="mb-3 h-8 w-8" aria-hidden="true" />
          <span className="block text-lg font-extrabold">צ׳ק-ליסט לדירה</span>
          <span className="mt-1 block text-sm font-medium text-white/90">לפני שחותמים על חוזה. נשמר במכשיר.</span>
        </button>
        <button type="button" onClick={() => setTool("calculator")} className="rounded-3xl border-2 border-b-4 border-duo-green-dark bg-duo-green p-4 text-right text-white active:translate-y-1 active:border-b-0">
          <Calculator className="mb-3 h-8 w-8" aria-hidden="true" />
          <span className="block text-lg font-extrabold">מחשבון ברוטו-נטו</span>
          <span className="mt-1 block text-sm font-medium text-white/90">לאן הולך הכסף בתלוש, לפי כללי 2026.</span>
        </button>
      </div>
    </div>
  )
}

function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        className="grid h-10 w-10 place-items-center rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-duo-blue"
        aria-label="חזרה לארגז הכלים"
      >
        <ArrowRight aria-hidden="true" />
      </button>
      <h1 className="text-xl font-extrabold">{title}</h1>
    </div>
  )
}

function Checklist({ onBack }: { onBack: () => void }) {
  const { state, toggleCheck } = useProgress()
  const done = checklistItems.filter((item) => state.checklist[item.id]).length
  const allDone = done === checklistItems.length

  return (
    <div className="px-4 py-5">
      <BackHeader title="צ׳ק-ליסט לדירה" onBack={onBack} />
      <p className="text-sm leading-6 text-muted">מסמנים בסיור. הרשימה נשמרת אצלכם, גם אם סוגרים את האפליקציה.</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={done} aria-valuemax={checklistItems.length} aria-label="פריטים שנבדקו">
        <div className="h-full rounded-full bg-duo-blue" style={{ width: `${(done / checklistItems.length) * 100}%` }} />
      </div>
      <p className="mt-1 text-xs font-bold text-muted">
        {done} מתוך {checklistItems.length}
      </p>
      {allDone && (
        <p className="mt-3 rounded-2xl bg-duo-green-soft px-3 py-2 text-sm font-bold text-duo-green-dark">
          הסיור כוסה. עדיין קוראים את החוזה לפני שמעבירים כסף.
        </p>
      )}
      <div className="mt-4 space-y-5">
        {checklist.map((group) => (
          <section key={group.id}>
            <h2 className="mb-2 flex items-center gap-2 font-extrabold">
              <Home className="h-4 w-4 text-duo-blue" aria-hidden="true" />
              {group.title}
            </h2>
            <ul className="grid gap-2">
              {group.items.map((item) => {
                const on = Boolean(state.checklist[item.id])
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleCheck(item.id)}
                      className={cn(
                        "w-full rounded-2xl border-2 border-b-4 px-3 py-3 text-right active:translate-y-1 active:border-b-0",
                        on ? "border-duo-blue-dark bg-duo-blue-soft" : "border-line bg-white",
                      )}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 text-xs font-extrabold",
                            on ? "border-duo-blue bg-duo-blue text-white" : "border-line bg-white",
                          )}
                          aria-hidden="true"
                        >
                          {on ? "✓" : ""}
                        </span>
                        <span>
                          <span className="block font-extrabold">{item.text}</span>
                          <span className="mt-1 block text-sm leading-5 text-muted">{item.hint}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function PayCalculator({ onBack }: { onBack: () => void }) {
  const { state, setCalculator } = useProgress()
  const { gross, points, studyFund } = state.calculator
  const pay = calculatePay({ gross, points, studyFund })

  const setGross = (value: number) => setCalculator({ gross: Math.min(35000, Math.max(6000, value)) })
  const setPoints = (value: number) => setCalculator({ points: Math.min(12, Math.max(0, Math.round(value * 4) / 4)) })

  return (
    <div className="px-4 py-5">
      <BackHeader title="ברוטו לנטו" onBack={onBack} />
      <p className="text-sm leading-6 text-muted">הערכה לשכיר במשרה אחת, בלי שווי רכב ובלי יישוב מזכה. לא ייעוץ מס.</p>

      <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-muted">שכר ברוטו לחודש</p>
        <p className="text-3xl font-extrabold" dir="ltr">
          {shekel(gross)}
        </p>
        <div className="mt-2 flex items-center gap-3" dir="ltr">
          <Button3D tone="white" className="px-3 py-2" onClick={() => setGross(gross - 100)} aria-label="הורדת 100 שקלים">
            −
          </Button3D>
          <input
            className="w-full"
            type="range"
            min={6000}
            max={35000}
            step={100}
            value={gross}
            aria-label="שכר ברוטו חודשי"
            aria-valuemin={6000}
            aria-valuemax={35000}
            aria-valuenow={gross}
            onChange={(event) => setGross(Number(event.target.value))}
          />
          <Button3D tone="white" className="px-3 py-2" onClick={() => setGross(gross + 100)} aria-label="הוספת 100 שקלים">
            +
          </Button3D>
        </div>
        <div className="mt-1 flex justify-between text-xs font-bold text-muted" dir="ltr">
          <span>{integer(6000)}</span>
          <span>{integer(35000)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-extrabold">נקודות זיכוי</p>
            <p className="text-xs text-muted">תושב 2.25 · תושבת 2.75</p>
          </div>
          <div className="flex items-center gap-2" dir="ltr">
            <Button3D tone="white" className="px-3 py-2" onClick={() => setPoints(points - 0.25)} aria-label="פחות נקודות זיכוי">
              −
            </Button3D>
            <span className="w-12 text-center text-lg font-extrabold" dir="ltr">
              {pointsLabel(points)}
            </span>
            <Button3D tone="white" className="px-3 py-2" onClick={() => setPoints(points + 0.25)} aria-label="עוד נקודות זיכוי">
              +
            </Button3D>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={studyFund}
          onClick={() => setCalculator({ studyFund: !studyFund })}
          className={cn(
            "mt-4 w-full rounded-2xl border-2 border-b-4 px-3 py-3 text-right font-extrabold active:translate-y-1 active:border-b-0",
            studyFund ? "border-duo-yellow-dark bg-duo-yellow" : "border-line bg-white",
          )}
        >
          {studyFund ? "קרן השתלמות: 2.5% כלולים" : "בלי קרן השתלמות"}
        </button>
      </div>

      <div className="mt-4 flex h-8 overflow-hidden rounded-full bg-line" aria-hidden="true">
        {pay.slices
          .filter((slice) => slice.amount > 0)
          .map((slice) => (
            <div key={slice.id} className={sliceColor[slice.tone]} style={{ width: `${(slice.amount / pay.gross) * 100}%` }} />
          ))}
      </div>

      <ul className="mt-3 grid gap-2">
        {pay.slices.map((slice) => (
          <li key={slice.id} className="rounded-2xl bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 font-extrabold">
                <span className={cn("h-3 w-3 rounded-full", sliceColor[slice.tone])} aria-hidden="true" />
                {slice.label}
              </span>
              <span className="font-extrabold" dir="ltr">
                {shekel(slice.amount)}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{slice.note}</p>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-2xl bg-duo-purple-soft px-3 py-3 text-sm leading-6">
        <p className="font-extrabold">מחוץ לנטו, על שמכם</p>
        <p>
          המעסיק מוסיף בערך {shekel(pay.employerPension)} לפנסיה (6.5% תגמולים + 6% פיצויים). זה לא יורד מהברוטו.
        </p>
      </div>
      <p className="mt-3 text-sm font-bold text-ink">
        השקל הבא נמצא במדרגת מס של <span dir="ltr">{Math.round(pay.marginalRate * 100)}%</span>. המדרגה חלה רק על התוספת, ונקודות הזיכוי הן סכום קבוע של {shekel(CREDIT_POINT_NIS)} לנקודה.
      </p>

      <details className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6">
        <summary className="cursor-pointer font-extrabold">איך חישבנו? נכון ל-2026</summary>
        <ul className="mt-2 list-disc space-y-1 pe-4 text-muted">
          <li>מס הכנסה: 10% עד 7,010 ₪, 14% עד 10,060, 20% עד 19,000, 31% עד 25,100, 35% עד 46,690, ואז 47%. מעל 60,130 ₪ נוסף מס יסף של 3%.</li>
          <li>נקודת זיכוי: 242 ₪ לחודש, יורדת מהמס.</li>
          <li>ביטוח לאומי חלק עובד: 1.04% עד 7,703 ₪ ואז 7% עד 51,910 ₪. מס בריאות: 3.23% ואז 5.17% באותם תחומים.</li>
          <li>פנסיה: 6% מהברוטו. זיכוי מס של 35% על ההפקדה, עד 679 ₪ הפקדה בחודש.</li>
          <li>המחשבון מניח הפרשת פנסיה מכל הברוטו, משרה אחת, ובלי שווי רכב או קרן מעסיק מעל התקרה.</li>
        </ul>
      </details>
    </div>
  )
}
