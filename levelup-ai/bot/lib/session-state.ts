import { asJson, type RequestCard, type SessionState, type ValidationResult } from "./types.js";

export function sessionKey(sessionId: string, suffix: string): string {
  return `session:${sessionId}:${suffix}`;
}

export function emptyState(): SessionState {
  return { phase: "asking" };
}

export function asState(value: unknown): SessionState {
  if (!value || typeof value !== "object") return emptyState();
  const o = value as SessionState;
  if (o.phase !== "asking" && o.phase !== "ready" && o.phase !== "delivered") {
    return { ...o, phase: "asking" };
  }
  return o;
}

export function withCard(state: SessionState, requestCard: RequestCard): SessionState {
  return { ...state, requestCard, phase: state.phase === "asking" ? "ready" : state.phase };
}

export function withSpec(
  state: SessionState,
  gameSpec: unknown,
  lastValidation?: ValidationResult,
): SessionState {
  return { ...state, gameSpec: asJson(gameSpec), lastValidation, phase: "delivered" };
}
