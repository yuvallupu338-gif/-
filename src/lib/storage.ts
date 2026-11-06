import { freshState, sanitizeState, type ProgressState } from "./progress"

const KEY = "bogrim-v1"

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    return sanitizeState(JSON.parse(raw))
  } catch {
    return freshState()
  }
}

export function saveState(state: ProgressState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* Private mode or a full disk should not crash the lesson. */
  }
}
