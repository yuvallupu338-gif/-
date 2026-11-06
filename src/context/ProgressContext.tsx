import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { earnedBadges, type Badge } from "../data/badges"
import { loadState, saveState } from "../lib/storage"
import {
  applyLesson,
  applyNewDay,
  effectiveStreak,
  freshState,
  loseHeart,
  refillHearts,
  type LessonReward,
  type ProgressState,
} from "../lib/progress"

type FinishResult = { reward: LessonReward; newBadges: Badge[] }

type ProgressApi = {
  state: ProgressState
  streak: number
  earned: Badge[]
  onboard: (name: string) => void
  loseHeart: () => void
  refillHearts: () => boolean
  finishLesson: (input: { lessonId: string; correct: number; total: number; practice: boolean }) => FinishResult
  toggleCheck: (id: string) => void
  seeTerm: (id: string) => void
  setCalculator: (patch: Partial<ProgressState["calculator"]>) => void
  celebrate: (ids: string[]) => void
  reset: () => void
}

const ProgressContext = createContext<ProgressApi | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadState())
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const sync = () => setState((current) => applyNewDay(current))
    window.addEventListener("focus", sync)
    document.addEventListener("visibilitychange", sync)
    return () => {
      window.removeEventListener("focus", sync)
      document.removeEventListener("visibilitychange", sync)
    }
  }, [])

  const api = useMemo<ProgressApi>(() => {
    return {
      state,
      streak: effectiveStreak(state),
      earned: earnedBadges(state),
      onboard: (name) => {
        setState((current) => ({
          ...current,
          onboarded: true,
          displayName: name.trim().slice(0, 24),
        }))
      },
      loseHeart: () => setState((current) => loseHeart(current)),
      refillHearts: () => {
        const next = refillHearts(stateRef.current)
        if (!next) return false
        stateRef.current = next
        setState(next)
        return true
      },
      finishLesson: (input) => {
        const current = stateRef.current
        const before = new Set(earnedBadges(current).map((badge) => badge.id))
        const result = applyLesson(current, input)
        stateRef.current = result.state
        setState(result.state)
        return {
          reward: result.reward,
          newBadges: earnedBadges(result.state).filter((badge) => !before.has(badge.id)),
        }
      },
      toggleCheck: (id) => {
        setState((current) => ({
          ...current,
          checklist: { ...current.checklist, [id]: !current.checklist[id] },
        }))
      },
      seeTerm: (id) => {
        setState((current) =>
          current.glossarySeen.includes(id)
            ? current
            : { ...current, glossarySeen: [...current.glossarySeen, id] },
        )
      },
      setCalculator: (patch) => {
        setState((current) => ({ ...current, calculator: { ...current.calculator, ...patch } }))
      },
      celebrate: (ids) => {
        setState((current) => ({
          ...current,
          celebratedBadges: [...new Set([...current.celebratedBadges, ...ids])],
        }))
      },
      reset: () => {
        const next = { ...freshState(), onboarded: true, displayName: stateRef.current.displayName }
        stateRef.current = next
        setState(next)
      },
    }
  }, [state])

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const value = useContext(ProgressContext)
  if (!value) throw new Error("useProgress must be used inside ProgressProvider")
  return value
}
