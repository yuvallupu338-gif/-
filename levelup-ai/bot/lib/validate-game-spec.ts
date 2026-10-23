import { cardLimits } from "./request-card.js";
import { parseGrid, parseSolution, allowedOk, traceProgram } from "./program.js";
import {
  CHALLENGE_TYPES,
  COLOR_PATTERN,
  COLLECTIBLE_KINDS,
  DIFFICULTIES,
  ENVIRONMENTS,
  GAME_TYPE_LAYOUT,
  GAME_TYPES,
  HAZARD_LEVELS,
  ID_PATTERN,
  LANGUAGES,
  LAYOUT_MECHANICS,
  LAYOUTS,
  MECHANICS,
  NPC_SHAPES,
  SIZES,
  SUBJECT_CATEGORIES,
  TIER_CHALLENGE_TYPES,
  TIER_GAME_TYPES,
  TIER_MAX_AREAS,
  TIMES_OF_DAY,
  type FeatureTier,
  type Mechanic,
  type Mode,
  type RequestCard,
  type ScoreEstimate,
  type ValidationIssue,
  type ValidationResult,
} from "./types.js";

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function int(v: unknown): number | undefined {
  return typeof v === "number" && Number.isInteger(v) ? v : undefined;
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function trimLen(v: unknown): number {
  return typeof v === "string" ? v.trim().length : -1;
}

export function validateGameSpec(
  spec: unknown,
  opts: {
    mode?: Mode;
    level?: FeatureTier;
    device?: "phone" | "desktop";
    chat?: boolean;
  } = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const error = (path: string, message: string) => issues.push({ path, message, severity: "error" });
  const warn = (path: string, message: string) => issues.push({ path, message, severity: "warning" });

  if (!isObj(spec)) {
    return {
      ok: false,
      errorCount: 1,
      warningCount: 0,
      issues: [{ path: "$", message: "GameSpec must be a JSON object", severity: "error" }],
      summary: "1 error: GameSpec must be a JSON object",
    };
  }

  const mode: Mode = opts.mode ?? "FAST";
  const level: FeatureTier = opts.level ?? "A";
  const device = opts.device ?? "phone";
  const chat = opts.chat !== false;

  checkMeta(spec, error, warn);
  const learningIds = checkLearning(spec, error);
  checkTheme(spec, error);
  const mechanics = checkMechanics(spec, error);

  const areas = Array.isArray(spec.areas) ? spec.areas : [];
  const missions = Array.isArray(spec.missions) ? spec.missions : [];
  const challenges = Array.isArray(spec.challenges) ? spec.challenges : [];
  const bosses = Array.isArray(spec.bosses) ? spec.bosses : [];

  if (!Array.isArray(spec.areas) || spec.areas.length < 1 || spec.areas.length > 4) {
    error("areas", "must have 1–4 areas");
  }
  if (!Array.isArray(spec.missions) || spec.missions.length < 1 || spec.missions.length > 8) {
    error("missions", "must have 1–8 missions");
  }
  if (!Array.isArray(spec.challenges) || spec.challenges.length < 1 || spec.challenges.length > 24) {
    error("challenges", "must have 1–24 challenges");
  }
  if (spec.bosses !== undefined && (!Array.isArray(spec.bosses) || spec.bosses.length > 3)) {
    error("bosses", "must have 0–3 bosses");
  }

  const ids = {
    areas: new Set<string>(),
    stations: new Set<string>(),
    npcs: new Set<string>(),
    missions: new Set<string>(),
    challenges: new Set<string>(),
    objectives: learningIds,
    bosses: new Set<string>(),
  };

  const areaById = new Map<string, Obj>();
  const stationById = new Map<string, { areaId: string; station: Obj; index: number }>();
  const npcById = new Map<string, { areaId: string; npc: Obj }>();
  const challengeById = new Map<string, Obj>();
  const missionById = new Map<string, Obj>();
  const bossById = new Map<string, Obj>();
  const loreIds = new Set<string>();
  const challengeStationOf = new Map<string, string>();
  const placedChallenges = new Set<string>();
  const variantIds = new Set<string>();

  areas.forEach((raw, i) => {
    if (!isObj(raw)) {
      error(`areas[${i}]`, "must be an object");
      return;
    }
    const id = takeId(raw.id, `areas[${i}].id`, ids.areas, error);
    if (id) areaById.set(id, raw);
    checkBounded(raw.name, `areas[${i}].name`, 60, error);
    checkBounded(raw.description, `areas[${i}].description`, 260, error);
    if (raw.intro !== undefined) checkBounded(raw.intro, `areas[${i}].intro`, 260, error);
    if (typeof raw.layout !== "string" || !(LAYOUTS as readonly string[]).includes(raw.layout)) {
      error(`areas[${i}].layout`, "must be plaza|corridor|rooms|terraces|lab");
    }
    if (raw.size !== undefined && (typeof raw.size !== "string" || !(SIZES as readonly string[]).includes(raw.size))) {
      error(`areas[${i}].size`, "must be small|medium|large");
    }
    if (
      raw.hazardLevel !== undefined &&
      (typeof raw.hazardLevel !== "string" || !(HAZARD_LEVELS as readonly string[]).includes(raw.hazardLevel))
    ) {
      error(`areas[${i}].hazardLevel`, "must be none|low|high");
    }
    if (device === "phone" && raw.hazardLevel === "high") {
      error(`areas[${i}].hazardLevel`, "phone allows hazardLevel none or low only");
    }
    if (raw.collectibles !== undefined) {
      if (!isObj(raw.collectibles)) error(`areas[${i}].collectibles`, "must be an object");
      else {
        const c = raw.collectibles;
        if (typeof c.kind !== "string" || !(COLLECTIBLE_KINDS as readonly string[]).includes(c.kind)) {
          error(`areas[${i}].collectibles.kind`, "must be gem|data-core|star|leaf|coin");
        }
        const count = int(c.count);
        if (count === undefined || count < 0 || count > 12) {
          error(`areas[${i}].collectibles.count`, "must be an integer 0–12");
        } else if (device === "phone" && count > 8) {
          warn(`areas[${i}].collectibles.count`, "phone fit cuts collectibles over 8 unless a collect objective needs them");
        }
        checkBounded(c.label, `areas[${i}].collectibles.label`, 40, error);
      }
    }
    const stations = Array.isArray(raw.stations) ? raw.stations : [];
    if (!Array.isArray(raw.stations) || stations.length < 1 || stations.length > 8) {
      error(`areas[${i}].stations`, "must have 1–8 stations");
    }
    stations.forEach((st, si) => {
      if (!isObj(st)) {
        error(`areas[${i}].stations[${si}]`, "must be an object");
        return;
      }
      const sid = takeId(st.id, `areas[${i}].stations[${si}].id`, ids.stations, error);
      checkBounded(st.label, `areas[${i}].stations[${si}].label`, 40, error);
      if (sid && id) stationById.set(sid, { areaId: id, station: st, index: si });
      if (st.kind === "lore") {
        if (sid) loreIds.add(sid);
        checkBounded(st.loreTitle, `areas[${i}].stations[${si}].loreTitle`, 70, error);
        checkBounded(st.loreText, `areas[${i}].stations[${si}].loreText`, 420, error);
      } else if (st.kind === "challenge") {
        const cid = str(st.challengeId);
        if (!cid) error(`areas[${i}].stations[${si}].challengeId`, "is required");
        else if (placedChallenges.has(cid)) error(`areas[${i}].stations[${si}].challengeId`, `${cid} is placed on more than one station`);
        else {
          placedChallenges.add(cid);
          if (sid) challengeStationOf.set(cid, sid);
        }
      } else {
        error(`areas[${i}].stations[${si}].kind`, "must be challenge or lore");
      }
    });
    const npcs = Array.isArray(raw.npcs) ? raw.npcs : [];
    if (raw.npcs !== undefined && (!Array.isArray(raw.npcs) || npcs.length > 3)) {
      error(`areas[${i}].npcs`, "must have 0–3 NPCs");
    }
    npcs.forEach((npc, ni) => {
      if (!isObj(npc)) {
        error(`areas[${i}].npcs[${ni}]`, "must be an object");
        return;
      }
      const nid = takeId(npc.id, `areas[${i}].npcs[${ni}].id`, ids.npcs, error);
      if (nid && id) npcById.set(nid, { areaId: id, npc });
      checkBounded(npc.name, `areas[${i}].npcs[${ni}].name`, 40, error);
      checkBounded(npc.role, `areas[${i}].npcs[${ni}].role`, 60, error);
      checkLook(npc.look, `areas[${i}].npcs[${ni}].look`, error);
      const lines = Array.isArray(npc.lines) ? npc.lines : [];
      if (!Array.isArray(npc.lines) || lines.length < 1 || lines.length > 5) {
        error(`areas[${i}].npcs[${ni}].lines`, "must have 1–5 lines");
      }
      lines.forEach((line, li) => checkBounded(line, `areas[${i}].npcs[${ni}].lines[${li}]`, 240, error));
      if (npc.hint !== undefined) checkBounded(npc.hint, `areas[${i}].npcs[${ni}].hint`, 220, error);
      if (npc.reactions !== undefined) {
        if (level !== "A") error(`areas[${i}].npcs[${ni}].reactions`, "NPC reactions are tier A only");
        if (!Array.isArray(npc.reactions) || npc.reactions.length > 3) {
          error(`areas[${i}].npcs[${ni}].reactions`, "must have 0–3 reactions");
        }
      }
    });
    if (raw.portal !== undefined) {
      if (!isObj(raw.portal)) error(`areas[${i}].portal`, "must be an object");
      else {
        checkBounded(raw.portal.label, `areas[${i}].portal.label`, 50, error);
        if (typeof raw.portal.toAreaId !== "string") error(`areas[${i}].portal.toAreaId`, "is required");
      }
    }
  });

  challenges.forEach((raw, i) => {
    if (!isObj(raw)) {
      error(`challenges[${i}]`, "must be an object");
      return;
    }
    const id = takeId(raw.id, `challenges[${i}].id`, ids.challenges, error);
    if (id) challengeById.set(id, raw);
    if (typeof raw.type !== "string" || !(CHALLENGE_TYPES as readonly string[]).includes(raw.type)) {
      error(`challenges[${i}].type`, "must be choice|numeric|sequence|match|program|simulation");
    } else if (!(TIER_CHALLENGE_TYPES[level] as readonly string[]).includes(raw.type)) {
      error(`challenges[${i}].type`, `${raw.type} is outside level ${level}`);
    }
    checkBounded(raw.title, `challenges[${i}].title`, 80, error);
    checkBounded(raw.prompt, `challenges[${i}].prompt`, 600, error);
    checkBounded(raw.concept, `challenges[${i}].concept`, 60, error);
    checkBounded(raw.explanation, `challenges[${i}].explanation`, 600, error, 40);
    if (raw.hint !== undefined) checkBounded(raw.hint, `challenges[${i}].hint`, 260, error);
    else warn(`challenges[${i}].hint`, "every challenge should have a hint");
    if (raw.objectiveId !== undefined && typeof raw.objectiveId === "string" && !ids.objectives.has(raw.objectiveId)) {
      error(`challenges[${i}].objectiveId`, `${raw.objectiveId} is not a learning objective`);
    }
    const lv = int(raw.level);
    if (raw.level !== undefined && (lv === undefined || lv < 1 || lv > 3)) {
      error(`challenges[${i}].level`, "must be an integer 1–3");
    }
    if (raw.timeLimitSec !== undefined) {
      if (level === "C") error(`challenges[${i}].timeLimitSec`, "timers are not allowed at level C");
      const t = int(raw.timeLimitSec);
      if (t === undefined || t < 10 || t > 180) error(`challenges[${i}].timeLimitSec`, "must be an integer 10–180");
      else if (device === "phone" && t < 30) error(`challenges[${i}].timeLimitSec`, "phone timers must be at least 30");
    }
    if (raw.easierId !== undefined) {
      if (level !== "A") error(`challenges[${i}].easierId`, "variants are tier A only");
      if (typeof raw.easierId === "string") variantIds.add(raw.easierId);
    }
    if (raw.harderId !== undefined) {
      if (level !== "A") error(`challenges[${i}].harderId`, "variants are tier A only");
      if (typeof raw.harderId === "string") variantIds.add(raw.harderId);
    }
    checkChallengeBody(raw, `challenges[${i}]`, error, warn);
  });

  variantIds.forEach((vid) => {
    if (!challengeById.has(vid)) error(`challenges`, `variant ${vid} does not exist`);
    if (placedChallenges.has(vid)) error(`challenges`, `variant ${vid} sits on a station; variants sit on no station`);
  });
  placedChallenges.forEach((cid) => {
    if (!challengeById.has(cid)) error("stations", `challengeId ${cid} does not exist`);
  });
  challengeById.forEach((_, cid) => {
    if (!placedChallenges.has(cid) && !variantIds.has(cid)) {
      error(`challenges`, `${cid} is not placed on any station`);
    }
  });
  for (const [base, raw] of challengeById) {
    const easier = str(raw.easierId);
    const harder = str(raw.harderId);
    if (easier === base || harder === base) error(`challenges`, `${base} names itself as a variant`);
  }

  const namedSolve = new Set<string>();
  const namedVisit = new Set<string>();
  const optionalMissions = new Set<string>();
  const missionArea = new Map<string, string>();
  const requiresOf = new Map<string, string[]>();

  missions.forEach((raw, i) => {
    if (!isObj(raw)) {
      error(`missions[${i}]`, "must be an object");
      return;
    }
    const id = takeId(raw.id, `missions[${i}].id`, ids.missions, error);
    if (id) missionById.set(id, raw);
    checkBounded(raw.title, `missions[${i}].title`, 80, error);
    checkBounded(raw.story, `missions[${i}].story`, 320, error);
    const areaId = str(raw.areaId);
    if (!areaId || !areaById.has(areaId)) error(`missions[${i}].areaId`, "must name an existing area");
    if (id && areaId) missionArea.set(id, areaId);
    if (raw.optional === true && id) {
      optionalMissions.add(id);
      if (level === "C") error(`missions[${i}].optional`, "side missions are not allowed at level C");
    }
    const req = Array.isArray(raw.requires) ? raw.requires : [];
    if (raw.requires !== undefined && (!Array.isArray(raw.requires) || req.length > 4)) {
      error(`missions[${i}].requires`, "must list 0–4 mission ids");
    }
    if (id) requiresOf.set(id, req.map(String));
    req.forEach((r, ri) => {
      if (typeof r !== "string") error(`missions[${i}].requires[${ri}]`, "must be a mission id");
      else if (r === id) error(`missions[${i}].requires[${ri}]`, "cannot require itself");
    });
    const objectives = Array.isArray(raw.objectives) ? raw.objectives : [];
    if (!Array.isArray(raw.objectives) || objectives.length < 1 || objectives.length > 4) {
      error(`missions[${i}].objectives`, "must have 1–4 objectives");
    }
    const area = areaId ? areaById.get(areaId) : undefined;
    const collectCount = area && isObj(area.collectibles) ? int(area.collectibles.count) ?? 0 : 0;
    objectives.forEach((obj, oi) => {
      if (!isObj(obj)) {
        error(`missions[${i}].objectives[${oi}]`, "must be an object");
        return;
      }
      checkBounded(obj.text, `missions[${i}].objectives[${oi}].text`, 200, error);
      const type = str(obj.type);
      if (type === "solve") {
        const cids = Array.isArray(obj.challengeIds) ? obj.challengeIds : [];
        if (!Array.isArray(obj.challengeIds) || cids.length < 1 || cids.length > 6) {
          error(`missions[${i}].objectives[${oi}].challengeIds`, "must list 1–6 challenge ids");
        }
        cids.forEach((cid) => {
          if (typeof cid !== "string") return;
          namedSolve.add(cid);
          if (!challengeById.has(cid)) error(`missions[${i}].objectives[${oi}].challengeIds`, `${cid} does not exist`);
          if (variantIds.has(cid)) error(`missions[${i}].objectives[${oi}].challengeIds`, `${cid} is a variant, not a base`);
          const st = [...stationById.values()].find((s) => s.station.challengeId === cid);
          if (st && areaId && st.areaId !== areaId) {
            error(`missions[${i}].objectives[${oi}].challengeIds`, `${cid} is not in area ${areaId}`);
          }
        });
      } else if (type === "collect") {
        const count = int(obj.count);
        if (count === undefined || count < 1 || count > 12) {
          error(`missions[${i}].objectives[${oi}].count`, "must be an integer 1–12");
        } else if (count > collectCount) {
          error(`missions[${i}].objectives[${oi}].count`, `only has ${collectCount} collectibles in the area`);
        }
      } else if (type === "talk") {
        const npcId = str(obj.npcId);
        if (!npcId || !npcById.has(npcId)) error(`missions[${i}].objectives[${oi}].npcId`, "must name an NPC");
        else if (areaId && npcById.get(npcId)?.areaId !== areaId) {
          error(`missions[${i}].objectives[${oi}].npcId`, `${npcId} is not in area ${areaId}`);
        }
      } else if (type === "visit") {
        const sids = Array.isArray(obj.stationIds) ? obj.stationIds : [];
        if (!Array.isArray(obj.stationIds) || sids.length < 1 || sids.length > 4) {
          error(`missions[${i}].objectives[${oi}].stationIds`, "must list 1–4 lore station ids");
        }
        sids.forEach((sid) => {
          if (typeof sid !== "string") return;
          namedVisit.add(sid);
          if (!loreIds.has(sid)) error(`missions[${i}].objectives[${oi}].stationIds`, `${sid} is not a lore station`);
          const st = stationById.get(sid);
          if (st && areaId && st.areaId !== areaId) {
            error(`missions[${i}].objectives[${oi}].stationIds`, `${sid} is not in area ${areaId}`);
          }
        });
      } else if (type === "defeat") {
        if (level !== "A") error(`missions[${i}].objectives[${oi}]`, "bosses are tier A only");
        const bossId = str(obj.bossId);
        if (!bossId) error(`missions[${i}].objectives[${oi}].bossId`, "is required");
      } else {
        error(`missions[${i}].objectives[${oi}].type`, "must be solve|collect|talk|visit|defeat");
      }
    });
  });

  bosses.forEach((raw, i) => {
    if (!isObj(raw)) {
      error(`bosses[${i}]`, "must be an object");
      return;
    }
    if (level !== "A") error(`bosses[${i}]`, "bosses are tier A only");
    const id = takeId(raw.id, `bosses[${i}].id`, ids.bosses, error);
    if (id) bossById.set(id, raw);
    const areaId = str(raw.areaId);
    if (!areaId || !areaById.has(areaId)) error(`bosses[${i}].areaId`, "must name an existing area");
    checkBounded(raw.name, `bosses[${i}].name`, 40, error);
    checkBounded(raw.title, `bosses[${i}].title`, 70, error);
    checkBounded(raw.intro, `bosses[${i}].intro`, 260, error);
    checkBounded(raw.defeatLine, `bosses[${i}].defeatLine`, 200, error);
    checkLook(raw.look, `bosses[${i}].look`, error);
    const phases = Array.isArray(raw.phaseStationIds) ? raw.phaseStationIds : [];
    if (!Array.isArray(raw.phaseStationIds) || phases.length < 2 || phases.length > 5) {
      error(`bosses[${i}].phaseStationIds`, "must list 2–5 challenge stations");
    }
    const seenPhase = new Set<string>();
    phases.forEach((sid, pi) => {
      if (typeof sid !== "string") {
        error(`bosses[${i}].phaseStationIds[${pi}]`, "must be a station id");
        return;
      }
      if (seenPhase.has(sid)) error(`bosses[${i}].phaseStationIds`, `${sid} is in more than one phase`);
      seenPhase.add(sid);
      const st = stationById.get(sid);
      if (!st) error(`bosses[${i}].phaseStationIds[${pi}]`, `${sid} does not exist`);
      else if (st.station.kind !== "challenge") error(`bosses[${i}].phaseStationIds[${pi}]`, `${sid} is not a challenge station`);
      else if (areaId && st.areaId !== areaId) error(`bosses[${i}].phaseStationIds[${pi}]`, `${sid} is not in the boss area`);
    });
  });

  missions.forEach((raw, i) => {
    if (!isObj(raw)) return;
    const objectives = Array.isArray(raw.objectives) ? raw.objectives : [];
    objectives.forEach((obj, oi) => {
      if (!isObj(obj) || obj.type !== "defeat") return;
      const bossId = str(obj.bossId);
      if (bossId && !bossById.has(bossId)) {
        error(`missions[${i}].objectives[${oi}].bossId`, `${bossId} does not exist`);
      } else if (bossId) {
        const boss = bossById.get(bossId);
        if (boss && str(boss.areaId) !== str(raw.areaId)) {
          error(`missions[${i}].objectives[${oi}].bossId`, `${bossId} is not in this mission's area`);
        }
      }
    });
  });

  npcById.forEach(({ npc }, nid) => {
    const reactions = Array.isArray(npc.reactions) ? npc.reactions : [];
    reactions.forEach((r, ri) => {
      if (!isObj(r)) return;
      const after = str(r.afterMissionId);
      if (after && !missionById.has(after)) {
        error(`npcs.${nid}.reactions[${ri}].afterMissionId`, `${after} does not exist`);
      }
      const lines = Array.isArray(r.lines) ? r.lines : [];
      if (!Array.isArray(r.lines) || lines.length < 1 || lines.length > 3) {
        error(`npcs.${nid}.reactions[${ri}].lines`, "must have 1–3 lines");
      }
      lines.forEach((line, li) => checkBounded(line, `npcs.${nid}.reactions[${ri}].lines[${li}]`, 240, error));
    });
  });

  requiresOf.forEach((reqs, mid) => {
    reqs.forEach((r) => {
      if (!missionById.has(r)) error(`missions.${mid}.requires`, `${r} does not exist`);
      if (optionalMissions.has(r)) error(`missions.${mid}.requires`, `nothing may require side mission ${r}`);
      const fromArea = missionArea.get(mid);
      const toArea = missionArea.get(r);
      if (fromArea && toArea && areaIndex(areas, toArea) > areaIndex(areas, fromArea)) {
        error(`missions.${mid}.requires`, `${r} is in a later area; portals only lead forward`);
      }
    });
  });
  if (hasCycle(requiresOf)) error("missions.requires", "form a cycle");

  checkPortals(areas, areaById, missionById, optionalMissions, mode, error);
  checkModeShape(spec, areas, missions, placedChallenges.size, mode, level, chat, error, warn);
  checkGameTypeLayouts(spec, areas, mechanics, level, error, warn);
  checkCoverage(challengeById, placedChallenges, namedSolve, loreIds, namedVisit, learningIds, warn);
  checkCompletable(areas, missions, stationById, loreIds, optionalMissions, requiresOf, error);
  const score = estimateScore(challenges, missions, bosses, areas, optionalMissions);
  if (score.optionalShare > 0.15) {
    warn("score", `optional content is ${(score.optionalShare * 100).toFixed(1)}% of the maximum; keep it under 15%`);
  }

  const language = isObj(spec.meta) ? str(spec.meta.language) : undefined;
  if (language === "he" || language === "ar") scanHebrew(spec, language, warn);
  scanGiveaways(challenges, spec, warn);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  return {
    ok: errorCount === 0,
    errorCount,
    warningCount,
    issues,
    summary:
      errorCount === 0 && warningCount === 0
        ? "0 errors, 0 warnings"
        : `${errorCount} error${errorCount === 1 ? "" : "s"}, ${warningCount} warning${warningCount === 1 ? "" : "s"}`,
    scoreEstimate: score,
    clampedNote: clampNote(level),
  };
}

export function validateAgainstCard(spec: unknown, card: RequestCard): ValidationResult {
  return validateGameSpec(spec, {
    mode: card.mode === "EXTEND" ? "FULL" : card.mode,
    level: card.level,
    device: card.device,
    chat: true,
  });
}

function takeId(
  value: unknown,
  path: string,
  seen: Set<string>,
  error: (path: string, message: string) => void,
): string | undefined {
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    error(path, "must match ^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$");
    return undefined;
  }
  if (seen.has(value)) {
    error(path, `${value} is not unique`);
    return undefined;
  }
  seen.add(value);
  return value;
}

function checkBounded(
  value: unknown,
  path: string,
  max: number,
  error: (path: string, message: string) => void,
  min = 1,
): void {
  if (typeof value !== "string") {
    error(path, "must be a string");
    return;
  }
  const n = value.trim().length;
  if (n < min || n > max) error(path, `must be ${min}–${max} characters after trim (got ${n})`);
  if (value === "") error(path, "empty strings are not allowed");
}

function checkLook(look: unknown, path: string, error: (p: string, m: string) => void): void {
  if (!isObj(look)) {
    error(path, "must be { color, shape }");
    return;
  }
  if (typeof look.color !== "string" || !COLOR_PATTERN.test(look.color)) {
    error(`${path}.color`, "must be #rrggbb");
  }
  if (typeof look.shape !== "string" || !(NPC_SHAPES as readonly string[]).includes(look.shape)) {
    error(`${path}.shape`, "must be robot|human|creature|orb");
  }
}

function checkMeta(spec: Obj, error: (p: string, m: string) => void, warn: (p: string, m: string) => void): void {
  if (!isObj(spec.meta)) {
    error("meta", "is required");
    return;
  }
  const m = spec.meta;
  checkBounded(m.title, "meta.title", 80, error);
  checkBounded(m.tagline, "meta.tagline", 160, error);
  checkBounded(m.subject, "meta.subject", 120, error);
  if (m.subjectCategory !== undefined && (typeof m.subjectCategory !== "string" || !(SUBJECT_CATEGORIES as readonly string[]).includes(m.subjectCategory))) {
    error("meta.subjectCategory", "must be programming|math|science|history|language|other");
  }
  if (typeof m.gameType !== "string" || !(GAME_TYPES as readonly string[]).includes(m.gameType)) {
    error("meta.gameType", "must be exploration|puzzle|platformer|simulation|adventure");
  }
  if (typeof m.difficulty !== "string" || !(DIFFICULTIES as readonly string[]).includes(m.difficulty)) {
    error("meta.difficulty", "must be beginner|intermediate|advanced");
  }
  if (typeof m.language !== "string" || !(LANGUAGES as readonly string[]).includes(m.language)) {
    error("meta.language", "must be he|en|ar|es|fr|de|ru");
  }
  const minutes = int(m.estimatedMinutes);
  if (minutes === undefined || minutes < 2 || minutes > 120) {
    error("meta.estimatedMinutes", "must be an integer 2–120");
  }
  if (m.featureTier !== undefined) warn("meta.featureTier", "is not a GameSpec field; it will be stripped");
  if (m.age !== undefined || m.grade !== undefined) warn("meta", "age/grade are not GameSpec fields");
}

function checkLearning(spec: Obj, error: (p: string, m: string) => void): Set<string> {
  const ids = new Set<string>();
  if (!isObj(spec.learning)) {
    error("learning", "is required");
    return ids;
  }
  checkBounded(spec.learning.goal, "learning.goal", 320, error);
  checkBounded(spec.learning.conclusion, "learning.conclusion", 700, error);
  const objectives = Array.isArray(spec.learning.objectives) ? spec.learning.objectives : [];
  if (!Array.isArray(spec.learning.objectives) || objectives.length < 1 || objectives.length > 6) {
    error("learning.objectives", "must have 1–6 objectives");
  }
  objectives.forEach((o, i) => {
    if (!isObj(o)) {
      error(`learning.objectives[${i}]`, "must be an object");
      return;
    }
    takeId(o.id, `learning.objectives[${i}].id`, ids, error);
    checkBounded(o.text, `learning.objectives[${i}].text`, 220, error);
  });
  return ids;
}

function checkTheme(spec: Obj, error: (p: string, m: string) => void): void {
  if (!isObj(spec.theme)) {
    error("theme", "is required");
    return;
  }
  if (typeof spec.theme.environment !== "string" || !(ENVIRONMENTS as readonly string[]).includes(spec.theme.environment)) {
    error("theme.environment", "must be a known environment");
  }
  if (spec.theme.timeOfDay !== undefined && (typeof spec.theme.timeOfDay !== "string" || !(TIMES_OF_DAY as readonly string[]).includes(spec.theme.timeOfDay))) {
    error("theme.timeOfDay", "must be day|dusk|night");
  }
  if (spec.theme.palette !== undefined) {
    if (!isObj(spec.theme.palette)) error("theme.palette", "must be an object");
    else {
      if (typeof spec.theme.palette.primary !== "string" || !COLOR_PATTERN.test(spec.theme.palette.primary)) {
        error("theme.palette.primary", "must be #rrggbb");
      }
      if (typeof spec.theme.palette.accent !== "string" || !COLOR_PATTERN.test(spec.theme.palette.accent)) {
        error("theme.palette.accent", "must be #rrggbb");
      }
    }
  }
}

function checkMechanics(spec: Obj, error: (p: string, m: string) => void): Set<Mechanic> {
  const set = new Set<Mechanic>();
  if (spec.mechanics === undefined) return set;
  if (!Array.isArray(spec.mechanics)) {
    error("mechanics", "must be an array");
    return set;
  }
  for (const m of spec.mechanics) {
    if (typeof m !== "string" || !(MECHANICS as readonly string[]).includes(m)) {
      error("mechanics", `unknown mechanic "${String(m)}"`);
    } else set.add(m as Mechanic);
  }
  return set;
}

function checkChallengeBody(
  raw: Obj,
  path: string,
  error: (p: string, m: string) => void,
  warn: (p: string, m: string) => void,
): void {
  if (raw.type === "choice") {
    const options = Array.isArray(raw.options) ? raw.options : [];
    if (!Array.isArray(raw.options) || options.length < 2 || options.length > 5) {
      error(`${path}.options`, "must have 2–5 options");
    }
    const texts = new Set<string>();
    const optionIds = new Set<string>();
    options.forEach((opt, i) => {
      if (!isObj(opt)) {
        error(`${path}.options[${i}]`, "must be an object");
        return;
      }
      takeId(opt.id, `${path}.options[${i}].id`, optionIds, error);
      checkBounded(opt.text, `${path}.options[${i}].text`, 220, error);
      checkBounded(opt.feedback, `${path}.options[${i}].feedback`, 320, error);
      const key = typeof opt.text === "string" ? opt.text.replace(/\s+/g, " ").trim() : "";
      if (key && texts.has(key)) error(`${path}.options`, "has two options with the same text");
      texts.add(key);
    });
    if (typeof raw.correctOptionId !== "string" || !optionIds.has(raw.correctOptionId)) {
      error(`${path}.correctOptionId`, "must name one of the options");
    }
    if (raw.answer !== undefined) warn(`${path}.answer`, "choice uses correctOptionId, not answer");
  } else if (raw.type === "numeric") {
    if (typeof raw.answer !== "number" || !Number.isFinite(raw.answer)) {
      error(`${path}.answer`, "must be a finite number");
    }
    const tol = num(raw.tolerance);
    if (raw.tolerance === undefined) error(`${path}.tolerance`, "must be written (0 for exact answers)");
    else if (tol === undefined || tol < 0 || tol > 1_000_000) error(`${path}.tolerance`, "must be 0–1000000");
    if (raw.unit !== undefined) checkBounded(raw.unit, `${path}.unit`, 12, error);
    const mistakes = Array.isArray(raw.commonMistakes) ? raw.commonMistakes : [];
    if (raw.commonMistakes !== undefined && (!Array.isArray(raw.commonMistakes) || mistakes.length > 3)) {
      error(`${path}.commonMistakes`, "must have 0–3 items");
    }
    mistakes.forEach((m, i) => {
      if (!isObj(m)) {
        error(`${path}.commonMistakes[${i}]`, "must be an object");
        return;
      }
      if (typeof m.value !== "number") error(`${path}.commonMistakes[${i}].value`, "must be a number");
      checkBounded(m.feedback, `${path}.commonMistakes[${i}].feedback`, 260, error);
      if (typeof m.value === "number" && typeof raw.answer === "number" && tol !== undefined) {
        if (Math.abs(m.value - raw.answer) <= tol) {
          error(`${path}.commonMistakes[${i}]`, "lists the correct answer as a common mistake");
        }
      }
    });
  } else if (raw.type === "sequence") {
    const items = Array.isArray(raw.items) ? raw.items : [];
    if (!Array.isArray(raw.items) || items.length < 3 || items.length > 6) {
      error(`${path}.items`, "must have 3–6 items in the correct order");
    }
    const itemIds = new Set<string>();
    const texts = new Set<string>();
    items.forEach((item, i) => {
      if (!isObj(item)) {
        error(`${path}.items[${i}]`, "must be an object");
        return;
      }
      takeId(item.id, `${path}.items[${i}].id`, itemIds, error);
      checkBounded(item.text, `${path}.items[${i}].text`, 180, error);
      const key = typeof item.text === "string" ? item.text.trim() : "";
      if (key && texts.has(key)) warn(`${path}.items`, "repeats an item");
      texts.add(key);
    });
    if (raw.correctOrder !== undefined) warn(`${path}.correctOrder`, "do not write correctOrder; list items in order");
  } else if (raw.type === "match") {
    const pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
    if (!Array.isArray(raw.pairs) || pairs.length < 3 || pairs.length > 6) {
      error(`${path}.pairs`, "must have 3–6 pairs");
    }
    const pairIds = new Set<string>();
    const lefts = new Set<string>();
    const rights = new Set<string>();
    pairs.forEach((p, i) => {
      if (!isObj(p)) {
        error(`${path}.pairs[${i}]`, "must be an object");
        return;
      }
      takeId(p.id, `${path}.pairs[${i}].id`, pairIds, error);
      checkBounded(p.left, `${path}.pairs[${i}].left`, 90, error);
      checkBounded(p.right, `${path}.pairs[${i}].right`, 140, error);
      const L = typeof p.left === "string" ? p.left.trim() : "";
      const R = typeof p.right === "string" ? p.right.trim() : "";
      if (L && lefts.has(L)) warn(`${path}.pairs`, "repeats a left side");
      if (R && rights.has(R)) warn(`${path}.pairs`, "repeats a right side");
      lefts.add(L);
      rights.add(R);
    });
  } else if (raw.type === "program") {
    const grid = parseGrid(raw.grid);
    if (typeof grid === "string") error(`${path}.grid`, grid);
    const allowed = allowedOk(raw.allowed);
    if (typeof allowed === "string") error(`${path}.allowed`, allowed);
    const maxBlocks = int(raw.maxBlocks);
    if (maxBlocks === undefined || maxBlocks < 1 || maxBlocks > 14) {
      error(`${path}.maxBlocks`, "must be an integer 1–14");
    }
    const solution = parseSolution(raw.solution);
    if (typeof solution === "string") error(`${path}.solution`, solution);
    if (typeof grid !== "string" && typeof allowed !== "string" && typeof solution !== "string" && maxBlocks !== undefined) {
      const trace = traceProgram(grid, allowed, maxBlocks, solution);
      if (trace) error(`${path}.solution`, `reference solution does not solve the puzzle (${trace})`);
    }
  } else if (raw.type === "simulation") {
    if (!isObj(raw.sim)) {
      error(`${path}.sim`, "is required");
      return;
    }
    if (raw.sim.kind === "projectile") {
      const g = num(raw.sim.gravity);
      const d = num(raw.sim.targetDistance);
      const t = num(raw.sim.tolerance);
      const s = num(raw.sim.maxSpeed);
      if (g === undefined || g < 1 || g > 25) error(`${path}.sim.gravity`, "must be 1–25");
      if (d === undefined || d < 5 || d > 200) error(`${path}.sim.targetDistance`, "must be 5–200");
      if (t === undefined || t < 0.5 || t > 15) error(`${path}.sim.tolerance`, "must be 0.5–15");
      if (s === undefined || s < 5 || s > 60) error(`${path}.sim.maxSpeed`, "must be 5–60");
      if (g && d && t && s && (s * s) / g + t < d) {
        error(`${path}.sim`, "target is out of reach");
      }
    } else if (raw.sim.kind === "lever") {
      const lw = num(raw.sim.leftWeight);
      const ld = num(raw.sim.leftDistance);
      const rw = num(raw.sim.rightWeight);
      const md = num(raw.sim.maxDistance);
      const t = num(raw.sim.tolerance);
      if (lw === undefined || lw < 1 || lw > 100) error(`${path}.sim.leftWeight`, "must be 1–100");
      if (ld === undefined || ld < 0.5 || ld > 10) error(`${path}.sim.leftDistance`, "must be 0.5–10");
      if (rw === undefined || rw < 1 || rw > 100) error(`${path}.sim.rightWeight`, "must be 1–100");
      if (md === undefined || md < 1 || md > 20) error(`${path}.sim.maxDistance`, "must be 1–20");
      if (t === undefined || t < 0.05 || t > 2) error(`${path}.sim.tolerance`, "must be 0.05–2");
      if (lw && ld && rw && md) {
        const balance = (lw * ld) / rw;
        if (balance < 0.5 || balance > md) error(`${path}.sim`, "balance point is outside the lever");
      }
    } else {
      error(`${path}.sim.kind`, "must be projectile or lever");
    }
  }
}

function areaIndex(areas: unknown[], id: string): number {
  return areas.findIndex((a) => isObj(a) && a.id === id);
}

function hasCycle(requiresOf: Map<string, string[]>): boolean {
  const state = new Map<string, 0 | 1 | 2>();
  const visit = (id: string): boolean => {
    const s = state.get(id) ?? 0;
    if (s === 1) return true;
    if (s === 2) return false;
    state.set(id, 1);
    for (const n of requiresOf.get(id) ?? []) {
      if (visit(n)) return true;
    }
    state.set(id, 2);
    return false;
  };
  for (const id of requiresOf.keys()) {
    if (visit(id)) return true;
  }
  return false;
}

function checkPortals(
  areas: unknown[],
  areaById: Map<string, Obj>,
  missionById: Map<string, Obj>,
  optionalMissions: Set<string>,
  mode: Mode,
  error: (p: string, m: string) => void,
): void {
  if (areas.length === 0) return;
  const first = isObj(areas[0]) ? str(areas[0].id) : undefined;
  areas.forEach((raw, i) => {
    if (!isObj(raw)) return;
    if (mode === "FAST" && raw.portal !== undefined) error(`areas[${i}].portal`, "FAST has no portal");
    if (i === areas.length - 1 && raw.portal !== undefined) {
      error(`areas[${i}].portal`, "the last area has no portal");
    }
  });
  if (mode === "FAST") return;
  const reached = new Set<string>();
  if (first) reached.add(first);
  let current = first;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const area = areaById.get(current);
    if (!area || !isObj(area.portal)) break;
    const to = str(area.portal.toAreaId);
    if (!to || !areaById.has(to)) {
      error(`areas.${current}.portal.toAreaId`, "must name an existing different area");
      break;
    }
    if (to === current) {
      error(`areas.${current}.portal.toAreaId`, "must be a different area");
      break;
    }
    const reqs = Array.isArray(area.portal.requiresMissionIds) ? area.portal.requiresMissionIds : [];
    if (reqs.length > 4) error(`areas.${current}.portal.requiresMissionIds`, "at most 4 mission ids");
    reqs.forEach((mid) => {
      if (typeof mid !== "string" || !missionById.has(mid)) {
        error(`areas.${current}.portal.requiresMissionIds`, `${String(mid)} does not exist`);
      } else if (optionalMissions.has(mid)) {
        error(`areas.${current}.portal.requiresMissionIds`, `cannot require side mission ${mid}`);
      }
    });
    reached.add(to);
    current = to;
  }
  areaById.forEach((_, id) => {
    if (!reached.has(id)) error(`areas.${id}`, "cannot be reached");
  });
}

function checkModeShape(
  spec: Obj,
  areas: unknown[],
  missions: unknown[],
  placed: number,
  mode: Mode,
  level: FeatureTier,
  chat: boolean,
  error: (p: string, m: string) => void,
  warn: (p: string, m: string) => void,
): void {
  const gameType = isObj(spec.meta) ? str(spec.meta.gameType) : undefined;
  if (gameType && !(TIER_GAME_TYPES[level] as readonly string[]).includes(gameType)) {
    error("meta.gameType", `${gameType} is outside level ${level}`);
  }
  if (areas.length > TIER_MAX_AREAS[level]) {
    error("areas", `level ${level} allows at most ${TIER_MAX_AREAS[level]} areas`);
  }
  const challengeStations = areas.reduce((n: number, a) => {
    if (!isObj(a) || !Array.isArray(a.stations)) return n;
    return n + a.stations.filter((s) => isObj(s) && s.kind === "challenge").length;
  }, 0);
  const minutes = isObj(spec.meta) ? int(spec.meta.estimatedMinutes) : undefined;
  if (mode === "FAST") {
    if (areas.length !== 1) error("areas", "FAST must have exactly 1 area");
    if (challengeStations < 3 || challengeStations > 6) {
      error("areas[0].stations", "FAST needs 3–6 challenge stations");
    }
    if (minutes !== undefined && (minutes < 4 || minutes > 10)) {
      warn("meta.estimatedMinutes", "FAST estimatedMinutes should be 4–10");
    }
  } else {
    if (areas.length < 2) error("areas", "FULL must have at least 2 areas");
    if (level === "B" && areas.length !== 2) error("areas", "level B FULL games have exactly 2 areas");
    if (missions.length < 4) error("missions", "FULL must have at least 4 missions");
    if (placed < 8) error("challenges", "FULL must place at least 8 challenges");
    if (chat && (placed < 8 || placed > 10)) {
      warn("challenges", "in chat a FULL game keeps 8–10 placed challenges");
    }
    if (minutes !== undefined && (minutes < 12 || minutes > 30)) {
      warn("meta.estimatedMinutes", "FULL estimatedMinutes should be 12–30");
    }
  }
}

function checkGameTypeLayouts(
  spec: Obj,
  areas: unknown[],
  mechanics: Set<Mechanic>,
  level: FeatureTier,
  error: (p: string, m: string) => void,
  warn: (p: string, m: string) => void,
): void {
  const gameType = isObj(spec.meta) ? str(spec.meta.gameType) : undefined;
  if (!gameType || !(gameType in GAME_TYPE_LAYOUT)) return;
  const allowed = GAME_TYPE_LAYOUT[gameType as keyof typeof GAME_TYPE_LAYOUT];
  const usedLayouts = new Set<string>();
  areas.forEach((raw, i) => {
    if (!isObj(raw) || typeof raw.layout !== "string") return;
    usedLayouts.add(raw.layout);
    if (!(allowed as readonly string[]).includes(raw.layout)) {
      error(`areas[${i}].layout`, `${raw.layout} does not match gameType ${gameType}`);
    }
    if ((raw.layout === "rooms" || raw.layout === "corridor") && !mechanics.has("gates")) {
      warn(`areas[${i}]`, "rooms/corridor doors stay open unless mechanics includes gates");
    }
    if (raw.hazardLevel === "low" || raw.hazardLevel === "high") {
      if (level === "C") error(`areas[${i}].hazardLevel`, "hazards are not allowed at level C");
      if (raw.layout !== "plaza" && raw.layout !== "terraces") {
        warn(`areas[${i}].hazardLevel`, "hazards only apply in plaza or terraces");
      }
    }
    if (mechanics.has("moving_platforms") && raw.layout !== "terraces") {
      warn(`areas[${i}]`, "moving_platforms only apply in terraces");
    }
  });
  mechanics.forEach((m) => {
    const supported = [...usedLayouts].some((layout) => (LAYOUT_MECHANICS[layout] ?? []).includes(m));
    if (!supported && m !== "jump") warn("mechanics", `${m} is not used by any area layout and will be dropped`);
  });
}

function checkCoverage(
  challengeById: Map<string, Obj>,
  placed: Set<string>,
  namedSolve: Set<string>,
  loreIds: Set<string>,
  namedVisit: Set<string>,
  learningIds: Set<string>,
  warn: (p: string, m: string) => void,
): void {
  placed.forEach((cid) => {
    if (!namedSolve.has(cid)) warn("missions", `placed challenge ${cid} is outside every solve objective`);
  });
  loreIds.forEach((sid) => {
    if (!namedVisit.has(sid)) warn("missions", `lore station ${sid} is not in a visit objective`);
  });
  const assessed = new Set<string>();
  challengeById.forEach((c) => {
    const oid = str(c.objectiveId);
    if (oid) assessed.add(oid);
  });
  learningIds.forEach((oid) => {
    if (!assessed.has(oid)) warn("learning.objectives", `${oid} has no challenge`);
  });
}

function checkCompletable(
  areas: unknown[],
  missions: unknown[],
  stationById: Map<string, { areaId: string; station: Obj; index: number }>,
  loreIds: Set<string>,
  optionalMissions: Set<string>,
  requiresOf: Map<string, string[]>,
  error: (p: string, m: string) => void,
): void {
  const done = new Set<string>();
  const doneStations = new Set<string>();
  let progressed = true;
  let guard = 0;
  while (progressed && guard < 32) {
    progressed = false;
    guard += 1;
    missions.forEach((raw) => {
      if (!isObj(raw)) return;
      const id = str(raw.id);
      if (!id || done.has(id)) return;
      const reqs = requiresOf.get(id) ?? [];
      if (!reqs.every((r) => done.has(r))) return;
      const area = areas.find((a) => isObj(a) && a.id === raw.areaId);
      const gated = isObj(area) && (area.layout === "rooms" || area.layout === "corridor");
      const objectives = Array.isArray(raw.objectives) ? raw.objectives : [];
      let ok = true;
      for (const obj of objectives) {
        if (!isObj(obj)) continue;
        if (obj.type === "solve") {
          const cids = Array.isArray(obj.challengeIds) ? obj.challengeIds : [];
          for (const cid of cids) {
            const hit = [...stationById.entries()].find(([, v]) => v.station.challengeId === cid);
            if (!hit) {
              ok = false;
              break;
            }
            const [sid, info] = hit;
            if (gated && !stationsUnlocked(area as Obj, info.index, doneStations)) ok = false;
            if (ok) doneStations.add(sid);
          }
        } else if (obj.type === "visit") {
          const sids = Array.isArray(obj.stationIds) ? obj.stationIds : [];
          for (const sid of sids) {
            if (typeof sid !== "string" || !loreIds.has(sid)) ok = false;
            else doneStations.add(sid);
          }
        }
      }
      if (ok) {
        done.add(id);
        progressed = true;
      }
    });
  }
  missions.forEach((raw) => {
    if (!isObj(raw)) return;
    const id = str(raw.id);
    if (id && !optionalMissions.has(id) && !done.has(id)) {
      error(`missions.${id}`, "cannot be finished");
    }
  });
}

function stationsUnlocked(area: Obj, index: number, doneStations: Set<string>): boolean {
  const stations = Array.isArray(area.stations) ? area.stations : [];
  for (let i = 0; i < index; i += 1) {
    const st = stations[i];
    if (isObj(st) && typeof st.id === "string" && !doneStations.has(st.id)) return false;
  }
  return true;
}

function estimateScore(
  challenges: unknown[],
  missions: unknown[],
  bosses: unknown[],
  areas: unknown[],
  optionalMissions: Set<string>,
): ScoreEstimate {
  let challengePoints = 0;
  let optionalChallenge = 0;
  const optionalChallengeIds = new Set<string>();
  missions.forEach((m) => {
    if (!isObj(m) || m.optional !== true) return;
    const objectives = Array.isArray(m.objectives) ? m.objectives : [];
    objectives.forEach((o) => {
      if (isObj(o) && Array.isArray(o.challengeIds)) {
        o.challengeIds.forEach((id) => {
          if (typeof id === "string") optionalChallengeIds.add(id);
        });
      }
    });
  });
  challenges.forEach((c) => {
    if (!isObj(c)) return;
    const level = int(c.level) ?? 1;
    const pts = level === 3 ? 200 : level === 2 ? 150 : 100;
    challengePoints += pts;
    if (typeof c.id === "string" && optionalChallengeIds.has(c.id)) optionalChallenge += pts;
  });
  const missionPoints = missions.length * 50;
  const optionalMissionsPts = optionalMissions.size * 50;
  const bossPoints = bosses.length * 150;
  let collectiblePoints = 0;
  let optionalCollect = 0;
  areas.forEach((a) => {
    if (!isObj(a) || !isObj(a.collectibles)) return;
    const count = int(a.collectibles.count) ?? 0;
    collectiblePoints += count * 10;
    const required = missions.reduce((n: number, m) => {
      if (!isObj(m) || m.areaId !== a.id || m.optional === true) return n;
      const objectives = Array.isArray(m.objectives) ? m.objectives : [];
      return (
        n +
        objectives.reduce((k: number, o) => (isObj(o) && o.type === "collect" ? k + (int(o.count) ?? 0) : k), 0)
      );
    }, 0);
    optionalCollect += Math.max(0, count - required) * 10;
  });
  const maximum = challengePoints + missionPoints + bossPoints + collectiblePoints;
  const optional = optionalChallenge + optionalMissionsPts + optionalCollect;
  return {
    challengePoints,
    missionPoints,
    bossPoints,
    collectiblePoints,
    maximum,
    optionalShare: maximum === 0 ? 0 : optional / maximum,
  };
}

function clampNote(level: FeatureTier): string | undefined {
  if (level === "A") return undefined;
  if (level === "B") return "clamped to tier B: bosses, reactions and variants are removed";
  return "clamped to tier C: bosses, reactions, variants, match, side missions, hazards and timers are removed";
}

const MATH_SIGN = /[=+\u2212×÷]/;
const COMPARE = /[<>≤≥]/;
const CONTROL = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/;
const EMOJI = /\p{Extended_Pictographic}/u;
const HE_SINGULAR = /(^|[\s"״]) (אתה|בחר|תבחר|תחשוב|תסדר)(?=$|[\s.,!?])/u;

function walkStrings(value: unknown, fn: (path: string, text: string) => void, path = "$"): void {
  if (typeof value === "string") {
    fn(path, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walkStrings(v, fn, `${path}[${i}]`));
    return;
  }
  if (isObj(value)) {
    for (const [k, v] of Object.entries(value)) walkStrings(v, fn, `${path}.${k}`);
  }
}

function scanHebrew(spec: Obj, language: string, warn: (p: string, m: string) => void): void {
  const expressionOk = /\.(prompt|feedback|hint|explanation|loreText|text|left|right)$/;
  walkStrings(spec, (path, text) => {
    if (CONTROL.test(text)) warn(path, "contains a direction-control character that the validator strips");
    if (EMOJI.test(text)) warn(path, "emoji are not allowed");
    if (language === "he" && HE_SINGULAR.test(text)) {
      warn(path, "Hebrew player address should stay plural (בחרו, חשבו), not masculine singular");
    }
    if ((language === "he" || language === "ar") && COMPARE.test(text) && !expressionOk.test(path)) {
      warn(path, "do not write <, >, ≤ or ≥ in Hebrew/Arabic prose");
    }
    if (MATH_SIGN.test(text) && /\d/.test(text) && !expressionOk.test(path) && !/\.(prompt|options|feedback|hint|explanation|loreText|items|pairs)/.test(path)) {
      if (/\.(title|concept|lines|story|goal|conclusion|name|intro|defeatLine|label|loreTitle)$/.test(path)) {
        warn(path, "plain texts cannot hold a maths expression with a sign between numbers");
      }
    }
  });
}

function scanGiveaways(challenges: unknown[], spec: Obj, warn: (p: string, m: string) => void): void {
  const answers: { id: string; tokens: string[] }[] = [];
  challenges.forEach((c) => {
    if (!isObj(c) || typeof c.id !== "string") return;
    const tokens: string[] = [];
    if (c.type === "choice" && Array.isArray(c.options) && typeof c.correctOptionId === "string") {
      const opt = c.options.find((o) => isObj(o) && o.id === c.correctOptionId);
      if (isObj(opt) && typeof opt.text === "string") tokens.push(opt.text.trim());
    }
    if (c.type === "numeric" && typeof c.answer === "number") {
      const token = String(c.answer);
      if (token.length >= 2) tokens.push(token);
    }
    answers.push({ id: c.id, tokens: tokens.filter((t) => t.length >= 6) });
  });
  answers.forEach(({ id, tokens }) => {
    tokens.forEach((token) => {
      walkStrings(spec, (path, text) => {
        if (/feedback|explanation|commonMistakes/.test(path)) return;
        const challengeSelf = path.match(/challenges\[(\d+)\]/);
        if (challengeSelf) {
          const self = challenges[Number(challengeSelf[1])];
          if (isObj(self) && self.id === id) return;
        }
        if (text.includes(token)) {
          warn(path, `may give away the answer of ${id}`);
        }
      });
    });
  });
}

export function limitsForCard(card: RequestCard) {
  return cardLimits(card);
}
