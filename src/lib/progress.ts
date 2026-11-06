import { jerusalemDay, previousDay } from "./dates"

export const ECONOMY = {
  welcomeDiamonds: 30,
  refillCost: 30,
  answerXp: 10,
  practiceAnswerXp: 5,
  finishXp: 20,
  perfectXp: 15,
  clearDiamonds: 15,
  perfectDiamonds: 10,
  maxHearts: 5,
} as const

export type CompletedLesson = {
  correct: number
  total: number
  perfect: boolean
}

export type CalculatorPrefs = {
  gross: number
  points: number
  studyFund: boolean
}

export type ProgressState = {
  version: 1
  displayName: string
  onboarded: boolean
  xp: number
  diamonds: number
  hearts: number
  heartsDay: string
  streak: number
  lastLessonDay: string | null
  completed: Record<string, CompletedLesson>
  answered: number
  correctAnswers: number
  checklist: Record<string, boolean>
  glossarySeen: string[]
  celebratedBadges: string[]
  calculator: CalculatorPrefs
}

export type LessonReward = {
  xpGained: number
  diamondsGained: number
  answerXp: number
  finishXp: number
  perfectXp: number
  perfect: boolean
  practice: boolean
  alreadyDone: boolean
  heartRestored: boolean
}

export function freshState(today = jerusalemDay()): ProgressState {
  return {
    version: 1,
    displayName: "",
    onboarded: false,
    xp: 0,
    diamonds: ECONOMY.welcomeDiamonds,
    hearts: ECONOMY.maxHearts,
    heartsDay: today,
    streak: 0,
    lastLessonDay: null,
    completed: {},
    answered: 0,
    correctAnswers: 0,
    checklist: {},
    glossarySeen: [],
    celebratedBadges: [],
    calculator: { gross: 12000, points: 2.25, studyFund: false },
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

export function sanitizeState(raw: unknown, today = jerusalemDay()): ProgressState {
  const base = freshState(today)
  const data = asRecord(raw)
  if (data.version !== 1) return base

  const completed: Record<string, CompletedLesson> = {}
  for (const [id, value] of Object.entries(asRecord(data.completed))) {
    const item = asRecord(value)
    const total = Number(item.total)
    const correct = Number(item.correct)
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(correct)) continue
    completed[id] = {
      correct: Math.max(0, Math.min(total, correct)),
      total,
      perfect: Boolean(item.perfect) || correct >= total,
    }
  }

  const checklist: Record<string, boolean> = {}
  for (const [id, value] of Object.entries(asRecord(data.checklist))) {
    if (value === true) checklist[id] = true
  }

  const calculator = asRecord(data.calculator)
  const gross = Number(calculator.gross)
  const points = Number(calculator.points)

  const next: ProgressState = {
    ...base,
    displayName: typeof data.displayName === "string" ? data.displayName.slice(0, 24) : "",
    onboarded: data.onboarded === true,
    xp: Math.max(0, Math.round(Number(data.xp) || 0)),
    diamonds: Math.max(0, Math.round(Number(data.diamonds) || 0)),
    hearts: Math.min(ECONOMY.maxHearts, Math.max(0, Math.round(Number(data.hearts) || 0))),
    heartsDay: typeof data.heartsDay === "string" ? data.heartsDay : today,
    streak: Math.max(0, Math.round(Number(data.streak) || 0)),
    lastLessonDay: typeof data.lastLessonDay === "string" ? data.lastLessonDay : null,
    completed,
    answered: Math.max(0, Math.round(Number(data.answered) || 0)),
    correctAnswers: Math.max(0, Math.round(Number(data.correctAnswers) || 0)),
    checklist,
    glossarySeen: Array.isArray(data.glossarySeen)
      ? data.glossarySeen.filter((item): item is string => typeof item === "string")
      : [],
    celebratedBadges: Array.isArray(data.celebratedBadges)
      ? data.celebratedBadges.filter((item): item is string => typeof item === "string")
      : [],
    calculator: {
      gross: Number.isFinite(gross) ? Math.min(35000, Math.max(6000, Math.round(gross))) : 12000,
      points: Number.isFinite(points) ? Math.min(12, Math.max(0, Math.round(points * 4) / 4)) : 2.25,
      studyFund: calculator.studyFund === true,
    },
  }

  return applyNewDay(next, today)
}

export function applyNewDay(state: ProgressState, today = jerusalemDay()): ProgressState {
  if (state.heartsDay === today) return state
  return { ...state, hearts: ECONOMY.maxHearts, heartsDay: today }
}

export function effectiveStreak(state: ProgressState, today = jerusalemDay()) {
  if (!state.lastLessonDay) return 0
  if (state.lastLessonDay === today || state.lastLessonDay === previousDay(today)) return state.streak
  return 0
}

function withStreak(state: ProgressState, today: string): ProgressState {
  if (state.lastLessonDay === today) {
    return { ...state, streak: Math.max(1, state.streak), lastLessonDay: today }
  }
  const continued = state.lastLessonDay === previousDay(today)
  return {
    ...state,
    streak: continued ? state.streak + 1 : 1,
    lastLessonDay: today,
  }
}

export function applyLesson(
  state: ProgressState,
  input: { lessonId: string; correct: number; total: number; practice: boolean },
  today = jerusalemDay(),
): { state: ProgressState; reward: LessonReward } {
  const correct = Math.max(0, Math.min(input.total, input.correct))
  const perfect = correct === input.total
  const already = state.completed[input.lessonId]
  const practice = input.practice || Boolean(already)

  const answerXp = correct * (practice ? ECONOMY.practiceAnswerXp : ECONOMY.answerXp)
  const finishXp = practice ? 0 : ECONOMY.finishXp
  const perfectXp = !practice && perfect ? ECONOMY.perfectXp : 0
  const diamondsGained =
    practice || already ? 0 : ECONOMY.clearDiamonds + (perfect ? ECONOMY.perfectDiamonds : 0)
  const heartRestored = !practice && state.hearts < ECONOMY.maxHearts

  let next = withStreak(state, today)
  next = {
    ...next,
    xp: next.xp + answerXp + finishXp + perfectXp,
    diamonds: next.diamonds + diamondsGained,
    answered: next.answered + input.total,
    correctAnswers: next.correctAnswers + correct,
    completed: {
      ...next.completed,
      [input.lessonId]: {
        correct: Math.max(already?.correct ?? 0, correct),
        total: input.total,
        perfect: Boolean(already?.perfect) || perfect,
      },
    },
  }

  if (!practice && next.hearts < ECONOMY.maxHearts) {
    next = { ...next, hearts: next.hearts + 1 }
  }

  return {
    state: next,
    reward: {
      xpGained: answerXp + finishXp + perfectXp,
      diamondsGained,
      answerXp,
      finishXp,
      perfectXp,
      perfect,
      practice,
      alreadyDone: Boolean(already),
      heartRestored,
    },
  }
}

export function loseHeart(state: ProgressState): ProgressState {
  return { ...state, hearts: Math.max(0, state.hearts - 1) }
}

export function refillHearts(state: ProgressState): ProgressState | null {
  if (state.hearts >= ECONOMY.maxHearts || state.diamonds < ECONOMY.refillCost) return null
  return {
    ...state,
    diamonds: state.diamonds - ECONOMY.refillCost,
    hearts: ECONOMY.maxHearts,
  }
}
