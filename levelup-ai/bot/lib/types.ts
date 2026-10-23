/** Shared LEVEL UP GameSpec and request-card types. */

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
export const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const GAME_TYPES = [
  "exploration",
  "puzzle",
  "platformer",
  "simulation",
  "adventure",
] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const LANGUAGES = ["he", "en", "ar", "es", "fr", "de", "ru"] as const;
export type ContentLanguage = (typeof LANGUAGES)[number];

export const SUBJECT_CATEGORIES = [
  "programming",
  "math",
  "science",
  "history",
  "language",
  "other",
] as const;

export const ENVIRONMENTS = [
  "neon-city",
  "forest",
  "space-station",
  "desert-ruins",
  "ocean-floor",
  "laboratory",
  "castle",
  "sky-islands",
] as const;

export const TIMES_OF_DAY = ["day", "dusk", "night"] as const;
export const LAYOUTS = ["plaza", "corridor", "rooms", "terraces", "lab"] as const;
export const SIZES = ["small", "medium", "large"] as const;
export const HAZARD_LEVELS = ["none", "low", "high"] as const;
export const NPC_SHAPES = ["robot", "human", "creature", "orb"] as const;
export const COLLECTIBLE_KINDS = ["gem", "data-core", "star", "leaf", "coin"] as const;
export const CHALLENGE_TYPES = [
  "choice",
  "numeric",
  "sequence",
  "match",
  "program",
  "simulation",
] as const;
export type ChallengeType = (typeof CHALLENGE_TYPES)[number];

export const MECHANICS = [
  "collect",
  "dialogue",
  "jump",
  "hazards",
  "checkpoints",
  "moving_platforms",
  "gates",
  "portals",
  "timed_bonus",
  "adaptive_difficulty",
] as const;
export type Mechanic = (typeof MECHANICS)[number];

export const PROGRAM_ALLOWED = [
  "move",
  "turnLeft",
  "turnRight",
  "repeat",
  "ifPathClear",
] as const;
export const PROGRAM_SOLUTION_KINDS = ["move", "left", "right", "repeat", "if"] as const;
export const DIRS = ["N", "E", "S", "W"] as const;

export const MODES = ["FAST", "FULL", "EXTEND"] as const;
export type Mode = (typeof MODES)[number];

export const TIERS = ["A", "B", "C"] as const;
export type FeatureTier = (typeof TIERS)[number];

export const DEVICES = ["phone", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

export const TIER_GAME_TYPES: Record<FeatureTier, readonly GameType[]> = {
  C: ["exploration", "puzzle"],
  B: ["exploration", "puzzle", "platformer", "adventure"],
  A: ["exploration", "puzzle", "platformer", "adventure", "simulation"],
};

export const TIER_CHALLENGE_TYPES: Record<FeatureTier, readonly ChallengeType[]> = {
  C: ["choice", "numeric", "sequence"],
  B: ["choice", "numeric", "sequence", "match"],
  A: ["choice", "numeric", "sequence", "match", "program", "simulation"],
};

export const TIER_MAX_AREAS: Record<FeatureTier, number> = { C: 1, B: 2, A: 4 };

export const GAME_TYPE_LAYOUT: Record<GameType, readonly string[]> = {
  exploration: ["plaza"],
  puzzle: ["rooms"],
  platformer: ["terraces"],
  simulation: ["lab"],
  adventure: ["plaza", "corridor", "rooms", "terraces", "lab"],
};

export const LAYOUT_MECHANICS: Record<string, readonly Mechanic[]> = {
  plaza: ["collect", "dialogue", "jump", "hazards", "checkpoints", "portals", "timed_bonus", "adaptive_difficulty"],
  corridor: ["collect", "dialogue", "jump", "checkpoints", "gates", "portals", "timed_bonus", "adaptive_difficulty"],
  rooms: ["collect", "dialogue", "jump", "gates", "portals", "timed_bonus", "adaptive_difficulty"],
  terraces: [
    "collect",
    "dialogue",
    "jump",
    "hazards",
    "checkpoints",
    "moving_platforms",
    "portals",
    "timed_bonus",
    "adaptive_difficulty",
  ],
  lab: ["collect", "dialogue", "jump", "portals", "timed_bonus", "adaptive_difficulty"],
};

export type RequestCard = {
  mode: Mode;
  subject: string;
  learningGoal: string;
  difficulty: Difficulty;
  gameType: GameType;
  contentLanguage: ContentLanguage;
  level: FeatureTier;
  notes: string;
  material: { present: false } | { present: true; chars: number };
  device: Device;
  assumed: string[];
  adjustments: string[];
};

export type ValidationIssue = {
  path: string;
  message: string;
  severity: "error" | "warning";
};

export type ScoreEstimate = {
  challengePoints: number;
  missionPoints: number;
  bossPoints: number;
  collectiblePoints: number;
  maximum: number;
  optionalShare: number;
};

export type ValidationResult = {
  ok: boolean;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  summary: string;
  scoreEstimate?: ScoreEstimate;
  clampedNote?: string;
};

export type SessionPhase = "asking" | "ready" | "delivered";

export type SessionState = {
  phase: SessionPhase;
  requestCard?: RequestCard;
  design?: { [key: string]: Json };
  gameSpec?: Json;
  lastValidation?: ValidationResult;
};

export function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}
