import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Heart, X, XCircle } from "lucide-react"
import { lessonById, questionCorrectId, type Question } from "../data/lessons"
import { ECONOMY } from "../lib/progress"
import { useProgress } from "../context/ProgressContext"
import { cn } from "../lib/format"
import { Button3D } from "./Button3D"
import type { LessonReward } from "../lib/progress"
import type { Badge } from "../data/badges"

export type VictoryPayload = {
  lessonId: string
  correct: number
  total: number
  reward: LessonReward
  newBadges: Badge[]
}

export function LessonScreen({
  lessonId,
  onExit,
  onVictory,
}: {
  lessonId: string
  onExit: () => void
  onVictory: (payload: VictoryPayload) => void
}) {
  const lesson = lessonById(lessonId)
  const { state, loseHeart, refillHearts, finishLesson } = useProgress()
  const practice = Boolean(lesson && state.completed[lesson.id])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [quitOpen, setQuitOpen] = useState(false)
  const [outOfHearts, setOutOfHearts] = useState(!practice && state.hearts === 0)
  const finished = useRef(false)

  if (!lesson) {
    return (
      <div className="p-6">
        <p>השיעור לא נמצא.</p>
        <Button3D className="mt-4" onClick={onExit}>
          חזרה
        </Button3D>
      </div>
    )
  }

  const question = lesson.questions[index]
  const correctId = questionCorrectId(question)
  const isCorrect = selected === correctId
  const isLast = index === lesson.questions.length - 1

  const check = () => {
    if (!selected || checked) return
    setChecked(true)
    if (selected === correctId) setCorrectCount((count) => count + 1)
    else if (!practice) loseHeart()
  }

  const continueLesson = () => {
    if (!practice && state.hearts === 0 && !isLast) {
      setOutOfHearts(true)
      return
    }
    if (isLast) {
      if (finished.current) return
      finished.current = true
      const result = finishLesson({
        lessonId: lesson.id,
        correct: correctCount,
        total: lesson.questions.length,
        practice,
      })
      onVictory({
        lessonId: lesson.id,
        correct: correctCount,
        total: lesson.questions.length,
        reward: result.reward,
        newBadges: result.newBadges,
      })
      return
    }
    setIndex((value) => value + 1)
    setSelected(null)
    setChecked(false)
  }

  if (outOfHearts) {
    const canPay = state.diamonds >= ECONOMY.refillCost
    return (
      <div className="flex h-full flex-col justify-center px-5">
        <div className="mb-4 flex justify-center gap-1">
          {Array.from({ length: 5 }, (_, heart) => (
            <Heart key={heart} className="h-7 w-7 text-line" />
          ))}
        </div>
        <h1 className="text-center text-2xl font-extrabold">נגמרו הלבבות</h1>
        <p className="mt-2 text-center text-sm leading-6 text-muted">
          השיעור לא נספר. הלבבות מתמלאים מחר, או עכשיו ב-{ECONOMY.refillCost} יהלומים. שיעור שכבר הושלם אפשר לתרגל בלי לבבות.
        </p>
        <div className="mt-5 grid gap-3">
          <Button3D
            tone="red"
            full
            disabled={!canPay}
            onClick={() => {
              if (refillHearts()) onExit()
            }}
          >
            {canPay ? `מילוי ויציאה ב-${ECONOMY.refillCost} יהלומים` : "אין מספיק יהלומים"}
          </Button3D>
          <Button3D tone="white" full onClick={onExit}>
            חזרה למסלול
          </Button3D>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-duo-blue"
          aria-label="יציאה מהשיעור"
          onClick={() => setQuitOpen(true)}
        >
          <X />
        </button>
        <div
          className="flex flex-1 gap-1"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={lesson.questions.length}
          aria-valuenow={index + 1}
          aria-label={`שאלה ${index + 1} מתוך ${lesson.questions.length}`}
        >
          {lesson.questions.map((item, itemIndex) => (
            <div
              key={item.id}
              className={cn("h-3 flex-1 rounded-full", itemIndex <= index ? "bg-duo-green" : "bg-line")}
            />
          ))}
        </div>
        {practice ? (
          <span className="text-xs font-extrabold text-duo-blue">תרגול</span>
        ) : (
          <span className="flex items-center gap-1 text-sm font-extrabold text-duo-red" aria-label={`${state.hearts} לבבות`}>
            <Heart className="h-4 w-4 fill-duo-red" aria-hidden="true" />
            <span dir="ltr">{state.hearts}</span>
          </span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-extrabold text-duo-blue">{lesson.title}</p>
            <QuestionBody question={question} selected={selected} checked={checked} correctId={correctId} onSelect={setSelected} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0">
        {checked ? (
          <div
            role="status"
            className={cn("border-t-2 px-4 py-4", isCorrect ? "border-duo-green bg-duo-green-soft" : "border-duo-red bg-duo-red-soft")}
          >
            <div className={cn("flex items-center gap-2 text-lg font-extrabold", isCorrect ? "text-duo-green-dark" : "text-duo-red-dark")}>
              {isCorrect ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
              {isCorrect ? "נכון" : "לא בדיוק"}
            </div>
            {!isCorrect && (
              <p className="mt-1 text-sm font-bold text-ink">התשובה: {answerLabel(question, correctId)}</p>
            )}
            <p className="mt-1 text-sm leading-6 text-ink">{question.explanation}</p>
            {!isCorrect && !practice && <p className="mt-1 text-sm font-extrabold text-duo-red-dark">ירד לב אחד</p>}
            <Button3D className="mt-3" tone={isCorrect ? "green" : "red"} full onClick={continueLesson}>
              {isLast ? "סיום" : "המשך"}
            </Button3D>
          </div>
        ) : (
          <div className="border-t border-line bg-paper px-4 py-4">
            <Button3D full disabled={!selected} onClick={check}>
              בדיקה
            </Button3D>
          </div>
        )}
      </div>

      {quitOpen && (
        <div className="absolute inset-0 z-40 flex items-end bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="quit-title" className="w-full rounded-3xl bg-white p-5">
            <h2 id="quit-title" className="text-xl font-extrabold">
              לצאת מהשיעור?
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {practice
                ? "התרגול לא יישמר באמצע."
                : "השאלות שעניתם לא ייספרו. לב שכבר ירד נשאר למטה."}
            </p>
            <div className="mt-4 grid gap-3">
              <Button3D tone="red" full onClick={onExit}>
                יציאה
              </Button3D>
              <Button3D tone="white" full onClick={() => setQuitOpen(false)}>
                נשארים
              </Button3D>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionBody({
  question,
  selected,
  checked,
  correctId,
  onSelect,
}: {
  question: Question
  selected: string | null
  checked: boolean
  correctId: string
  onSelect: (id: string) => void
}) {
  const toneFor = (id: string) => {
    if (!checked) return selected === id ? "blue" : "white"
    if (id === correctId) return "green"
    if (id === selected) return "red"
    return "white"
  }

  if (question.type === "myth") {
    return (
      <div>
        <h1 className="mt-2 text-xl font-extrabold leading-8">אמת או מיתוס?</h1>
        <p className="mt-3 rounded-2xl border-2 border-line bg-white p-4 text-base font-bold leading-7">«{question.statement}»</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(
            [
              ["truth", "אמת"],
              ["myth", "מיתוס"],
            ] as const
          ).map(([id, label]) => (
            <Button3D key={id} tone={toneFor(id)} disabled={checked} onClick={() => onSelect(id)} aria-pressed={selected === id}>
              {label}
            </Button3D>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === "mine") {
    return (
      <div>
        <h1 className="mt-2 text-xl font-extrabold leading-8">מצאו את המוקש</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{question.intro}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border-2 border-[#e6dcc4] bg-[#fffaf0]">
          <p className="bg-[#f3ead6] px-4 py-2 text-sm font-extrabold">{question.documentTitle}</p>
          <div className="grid gap-2 p-3">
            {question.lines.map((line) => (
              <Button3D
                key={line.id}
                tone={toneFor(line.id)}
                disabled={checked}
                aria-pressed={selected === line.id}
                onClick={() => onSelect(line.id)}
                className="flex items-center justify-between gap-3 text-right text-sm"
              >
                <span>{line.label}</span>
                <span dir="ltr" className="shrink-0 font-extrabold">
                  {line.value}
                </span>
              </Button3D>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mt-2 text-xl font-extrabold leading-8">{question.prompt}</h1>
      <div className="mt-4 grid gap-3">
        {question.options.map((option) => (
          <Button3D
            key={option.id}
            tone={toneFor(option.id)}
            full
            disabled={checked}
            aria-pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
            className="text-right text-sm leading-6"
          >
            {option.text}
          </Button3D>
        ))}
      </div>
    </div>
  )
}

function answerLabel(question: Question, id: string) {
  if (question.type === "myth") return id === "truth" ? "אמת" : "מיתוס"
  if (question.type === "mc") return question.options.find((option) => option.id === id)?.text ?? ""
  const line = question.lines.find((item) => item.id === id)
  return line ? `${line.label}: ${line.value}` : ""
}
