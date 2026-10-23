import {
  DEVICES,
  DIFFICULTIES,
  GAME_TYPES,
  LANGUAGES,
  MODES,
  TIER_GAME_TYPES,
  TIERS,
  type ContentLanguage,
  type Device,
  type Difficulty,
  type FeatureTier,
  type GameType,
  type Mode,
  type RequestCard,
} from "./types.js";

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function normalizeRequestCard(input: Record<string, unknown>): RequestCard {
  const assumed: string[] = [];
  const adjustments: string[] = [];

  const device = asEnum(input.device, DEVICES, "phone");
  if (input.device === undefined) assumed.push("device: phone (LEVEL UP sets it)");

  let mode = asEnum(input.mode, MODES, "FAST");
  if (input.mode === undefined) {
    assumed.push("mode: FAST");
    if (device === "phone") assumed.push("phone prefers FAST unless a full adventure is asked for");
  }

  let level = asEnum(input.level, TIERS, "A");
  if (input.level === undefined) assumed.push("level: A (assumed)");

  if (mode === "FULL" && level === "C") {
    mode = "FAST";
    adjustments.push("FULL is not allowed at level C; using FAST");
  }

  const difficulty = asEnum(input.difficulty, DIFFICULTIES, "beginner");
  if (input.difficulty === undefined) assumed.push("difficulty: beginner");

  let gameType = asEnum(
    input.gameType,
    GAME_TYPES,
    mode === "FULL" ? "adventure" : "exploration",
  );
  if (input.gameType === undefined) {
    assumed.push(`gameType: ${gameType} (default for ${mode})`);
  }
  if (!(TIER_GAME_TYPES[level] as readonly string[]).includes(gameType)) {
    const fallback = TIER_GAME_TYPES[level][TIER_GAME_TYPES[level].length - 1] ?? "exploration";
    adjustments.push(`${gameType} is outside level ${level}; using ${fallback}`);
    gameType = fallback;
  }

  const contentLanguage = asEnum(input.contentLanguage, LANGUAGES, "he");
  if (input.contentLanguage === undefined) assumed.push("contentLanguage: he");

  const subject = clip(input.subject, 120);
  const learningGoal = clip(input.learningGoal, 500);
  const notes = clip(input.notes, 500);

  let material: RequestCard["material"] = { present: false };
  if (input.material === true || (typeof input.materialChars === "number" && input.materialChars > 0)) {
    const chars = Math.min(
      8000,
      typeof input.materialChars === "number"
        ? Math.floor(input.materialChars)
        : typeof input.material === "string"
          ? input.material.length
          : 0,
    );
    material = { present: true, chars };
  } else if (typeof input.material === "string" && input.material.trim()) {
    material = { present: true, chars: Math.min(8000, input.material.trim().length) };
  }

  return {
    mode,
    subject,
    learningGoal,
    difficulty,
    gameType,
    contentLanguage,
    level,
    notes,
    material,
    device,
    assumed,
    adjustments,
  };
}

export function formatRequestCard(card: RequestCard): string {
  const materialLine = card.material.present
    ? `yes, ${card.material.chars} characters (as pasted)`
    : "none";
  const assumed = card.assumed.length ? ` [${card.assumed.join("; ")}]` : "";
  const adjustments = card.adjustments.length ? `\nadjustments: ${card.adjustments.join("; ")}` : "";
  return [
    `mode: ${card.mode}`,
    `subject: ${card.subject}`,
    `learningGoal: ${card.learningGoal}`,
    `difficulty: ${card.difficulty}`,
    `gameType: ${card.gameType}`,
    `contentLanguage: ${card.contentLanguage}`,
    `level: ${card.level}${card.assumed.some((a) => a.startsWith("level:")) ? " (assumed)" : ""}`,
    `notes: ${card.notes}`,
    `material: ${materialLine}`,
    `device: ${card.device}${card.device === "phone" ? " (LEVEL UP sets it)" : ""}`,
  ].join("\n") + assumed + adjustments;
}

export function cardLimits(card: Pick<RequestCard, "mode" | "level" | "device" | "gameType">): {
  maxAreas: number;
  minAreas: number;
  challengeTypes: readonly string[];
  allowBosses: boolean;
  allowMatch: boolean;
  allowProgram: boolean;
  allowSimulation: boolean;
  allowSideMissions: boolean;
  allowHazards: boolean;
  allowTimers: boolean;
  allowReactions: boolean;
  allowVariants: boolean;
  chatChallengeCap: number;
} {
  const maxAreas = card.mode === "FAST" ? 1 : card.level === "B" ? 2 : card.level === "C" ? 1 : 4;
  return {
    maxAreas,
    minAreas: card.mode === "FULL" ? 2 : 1,
    challengeTypes: card.level === "C"
      ? ["choice", "numeric", "sequence"]
      : card.level === "B"
        ? ["choice", "numeric", "sequence", "match"]
        : ["choice", "numeric", "sequence", "match", "program", "simulation"],
    allowBosses: card.level === "A",
    allowMatch: card.level !== "C",
    allowProgram: card.level === "A",
    allowSimulation: card.level === "A",
    allowSideMissions: card.level !== "C",
    allowHazards: card.level !== "C",
    allowTimers: card.level !== "C",
    allowReactions: card.level === "A",
    allowVariants: card.level === "A",
    chatChallengeCap: card.mode === "FULL" ? 10 : 6,
  };
}

export type { ContentLanguage, Device, Difficulty, FeatureTier, GameType, Mode };
