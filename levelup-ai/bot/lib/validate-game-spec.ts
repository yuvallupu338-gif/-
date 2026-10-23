/**
 * LEVEL UP's GameSpec validator.
 *
 * Errors are the section 8 rules (schema, references, solvability,
 * completability). Warnings are the design limits a delivered game is
 * still expected to clear. Unknown keys are ignored: LEVEL UP strips them.
 * Null on an optional field counts as absent.
 */

export type Tier = "A" | "B" | "C";
export type Mode = "FAST" | "FULL" | "EXTEND";
export type Device = "phone" | "desktop";

export type ValidateOptions = {
  tier?: Tier;
  mode?: Mode;
  device?: Device;
};

export type Issue = { path: string; message: string };

export type ValidationReport = {
  ok: boolean;
  errors: Issue[];
  warnings: Issue[];
};

export type ClampResult =
  | { ok: true; spec: unknown }
  | { ok: false; errors: Issue[] };

const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

const GAME_TYPES = ["exploration", "puzzle", "platformer", "simulation", "adventure"] as const;
const LAYOUTS = ["plaza", "corridor", "rooms", "terraces", "lab"] as const;
const MECHANICS = [
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
const CHALLENGE_TYPES = ["choice", "numeric", "sequence", "match", "program", "simulation"] as const;
const LAYOUT_FOR_TYPE: Record<string, string | null> = {
  exploration: "plaza",
  puzzle: "rooms",
  platformer: "terraces",
  simulation: "lab",
  adventure: null,
};

const TIER_RANK: Record<Tier, number> = { C: 0, B: 1, A: 2 };

type Dict = Record<string, unknown>;

type NStation = {
  id: string;
  kind: "challenge" | "lore";
  challengeId?: string;
  index: number;
  path: string;
};

type NPortal = { toAreaId: string; requires: string[]; path: string };

type NArea = {
  id: string;
  index: number;
  layout: string;
  hazardLevel?: string;
  stations: NStation[];
  npcIds: Set<string>;
  collectCount: number;
  portal?: NPortal;
  path: string;
};

type NObjective =
  | { type: "solve"; challengeIds: string[]; path: string }
  | { type: "collect"; count: number; path: string }
  | { type: "talk"; npcId: string; path: string }
  | { type: "visit"; stationIds: string[]; path: string }
  | { type: "defeat"; bossId: string; path: string };

type NMission = {
  id: string;
  index: number;
  areaId: string;
  requires: string[];
  optional: boolean;
  objectives: NObjective[];
  path: string;
};

type NChallenge = {
  id: string;
  type: string;
  level?: number;
  objectiveId?: string;
  easierId?: string;
  harderId?: string;
  path: string;
};

type NBoss = {
  id: string;
  areaId: string;
  phaseStationIds: string[];
  path: string;
};

function isObj(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function present(value: unknown): boolean {
  return value !== undefined && value !== null;
}

class Report {
  errors: Issue[] = [];
  warnings: Issue[] = [];
  error(path: string, message: string) {
    this.errors.push({ path, message });
  }
  warn(path: string, message: string) {
    this.warnings.push({ path, message });
  }
}

function tierAllows(required: Tier, player: Tier): boolean {
  return TIER_RANK[player] >= TIER_RANK[required];
}

export function allowedGameTypes(tier: Tier): string[] {
  const types = ["exploration", "puzzle"];
  if (tierAllows("B", tier)) types.push("platformer", "adventure");
  if (tierAllows("A", tier)) types.push("simulation");
  return types;
}

export function allowedChallengeTypes(tier: Tier): string[] {
  const types = ["choice", "numeric", "sequence"];
  if (tierAllows("B", tier)) types.push("match");
  if (tierAllows("A", tier)) types.push("program", "simulation");
  return types;
}

export function allowedMechanics(tier: Tier): string[] {
  const mechanics = ["collect", "dialogue", "jump", "checkpoints", "moving_platforms", "gates"];
  if (tierAllows("B", tier)) mechanics.push("hazards", "timed_bonus", "portals");
  if (tierAllows("A", tier)) mechanics.push("adaptive_difficulty");
  return mechanics;
}

function text(report: Report, value: unknown, path: string, max: number, required: boolean): string | undefined {
  if (!present(value)) {
    if (required) report.error(path, "is required");
    return undefined;
  }
  if (typeof value !== "string") {
    report.error(path, "must be a string");
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length < 1) report.error(path, "is empty");
  else if ([...trimmed].length > max) report.error(path, `is longer than ${max} characters`);
  return trimmed;
}

function whole(report: Report, value: unknown, path: string, min: number, max: number, required: boolean): number | undefined {
  if (!present(value)) {
    if (required) report.error(path, "is required");
    return undefined;
  }
  if (typeof value !== "number" || !Number.isInteger(value)) {
    report.error(path, "must be a whole number");
    return undefined;
  }
  if (value < min || value > max) report.error(path, `must be from ${min} to ${max}`);
  return value;
}

function finite(report: Report, value: unknown, path: string, min: number, max: number, required: boolean): number | undefined {
  if (!present(value)) {
    if (required) report.error(path, "is required");
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    report.error(path, "must be a number");
    return undefined;
  }
  if (value < min || value > max) report.error(path, `must be from ${min} to ${max}`);
  return value;
}

function oneOf(report: Report, value: unknown, path: string, allowed: readonly string[], required: boolean): string | undefined {
  if (!present(value)) {
    if (required) report.error(path, "is required");
    return undefined;
  }
  if (typeof value !== "string" || !allowed.includes(value)) {
    report.error(path, `must be one of ${allowed.join(", ")}`);
    return undefined;
  }
  return value;
}

function color(report: Report, value: unknown, path: string) {
  const hex = text(report, value, path, 7, true);
  if (hex !== undefined && !COLOR_RE.test(hex)) report.error(path, "must be a #rrggbb colour");
}

function checkId(report: Report, value: unknown, path: string, kind: string, seen: Map<string, Map<string, string>>): string | undefined {
  const id = text(report, value, path, 40, true);
  if (id === undefined) return undefined;
  if (!ID_RE.test(id)) {
    report.error(path, "must be an ASCII id of letters, digits, - or _");
    return undefined;
  }
  let bucket = seen.get(kind);
  if (!bucket) {
    bucket = new Map();
    seen.set(kind, bucket);
  }
  const previous = bucket.get(id);
  if (previous) report.error(path, `duplicates ${kind} id ${id} also used at ${previous}`);
  else bucket.set(id, path);
  return id;
}

function normalizeSpace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function gatesApply(area: NArea, mechanics: string[]): boolean {
  return mechanics.includes("gates") && (area.layout === "rooms" || area.layout === "corridor");
}

function roomEnterable(area: NArea, room: number, done: Set<string>): boolean {
  for (let i = 0; i < room; i += 1) {
    const station = area.stations[i];
    if (!station || !done.has(station.id)) return false;
  }
  return true;
}

const DIR_DELTA: Record<string, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};
const TURN_LEFT: Record<string, string> = { N: "W", W: "S", S: "E", E: "N" };
const TURN_RIGHT: Record<string, string> = { N: "E", E: "S", S: "W", W: "N" };

type ProgState = { x: number; y: number; dir: string; actions: number; stopped: boolean };

function solutionMessage(reason: string): string {
  return `reference solution does not solve the puzzle (${reason})`;
}

/** Trace a program challenge. An empty list means the reference solution solves it. */
export function traceProgram(challenge: Dict): string[] {
  const report = new Report();
  const grid = challenge.grid;
  if (!isObj(grid)) {
    report.error("grid", "is required");
    return report.errors.map((issue) => `${issue.path}: ${issue.message}`);
  }
  const width = whole(report, grid.width, "grid.width", 3, 7, true);
  const height = whole(report, grid.height, "grid.height", 3, 7, true);
  const start = isObj(grid.start) ? grid.start : undefined;
  const goal = isObj(grid.goal) ? grid.goal : undefined;
  if (!start) report.error("grid.start", "is required");
  if (!goal) report.error("grid.goal", "is required");
  const dir = start ? oneOf(report, start.dir, "grid.start.dir", ["N", "E", "S", "W"], true) : undefined;
  const sx = start ? whole(report, start.x, "grid.start.x", 0, 6, true) : undefined;
  const sy = start ? whole(report, start.y, "grid.start.y", 0, 6, true) : undefined;
  const gx = goal ? whole(report, goal.x, "grid.goal.x", 0, 6, true) : undefined;
  const gy = goal ? whole(report, goal.y, "grid.goal.y", 0, 6, true) : undefined;
  const walls = new Set<string>();
  if (present(grid.walls)) {
    if (!Array.isArray(grid.walls)) report.error("grid.walls", "must be an array");
    else if (grid.walls.length > 24) report.error("grid.walls", "must be from 0 to 24");
    else {
      grid.walls.forEach((wall, index) => {
        if (!isObj(wall)) {
          report.error(`grid.walls[${index}]`, "must be an object");
          return;
        }
        const x = whole(report, wall.x, `grid.walls[${index}].x`, 0, 6, true);
        const y = whole(report, wall.y, `grid.walls[${index}].y`, 0, 6, true);
        if (x === undefined || y === undefined || width === undefined || height === undefined) return;
        if (x >= width || y >= height) report.error(`grid.walls[${index}]`, "is outside the grid");
        walls.add(`${x},${y}`);
      });
    }
  }
  const inside = (x: number, y: number) => width !== undefined && height !== undefined && x >= 0 && y >= 0 && x < width && y < height;
  if (sx !== undefined && sy !== undefined && width !== undefined && height !== undefined) {
    if (!inside(sx, sy)) report.error("grid.start", "is outside the grid");
    else if (walls.has(`${sx},${sy}`)) report.error("grid.start", "is on a wall");
  }
  if (gx !== undefined && gy !== undefined && width !== undefined && height !== undefined) {
    if (!inside(gx, gy)) report.error("grid.goal", "is outside the grid");
    else if (walls.has(`${gx},${gy}`)) report.error("grid.goal", "is on a wall");
  }
  if (sx !== undefined && sy !== undefined && sx === gx && sy === gy) {
    report.error("grid.goal", "start and goal are the same cell");
  }
  if (
    sx !== undefined &&
    sy !== undefined &&
    gx !== undefined &&
    gy !== undefined &&
    width !== undefined &&
    height !== undefined &&
    inside(sx, sy) &&
    inside(gx, gy) &&
    !walls.has(`${sx},${sy}`) &&
    !walls.has(`${gx},${gy}`) &&
    !(sx === gx && sy === gy)
  ) {
    const seen = new Set<string>([`${sx},${sy}`]);
    const queue: Array<[number, number]> = [[sx, sy]];
    let found = false;
    while (queue.length > 0) {
      const [x, y] = queue.shift() as [number, number];
      if (x === gx && y === gy) {
        found = true;
        break;
      }
      for (const [dx, dy] of Object.values(DIR_DELTA)) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (!inside(nx, ny) || walls.has(key) || seen.has(key)) continue;
        seen.add(key);
        queue.push([nx, ny]);
      }
    }
    if (!found) report.error("grid.goal", "goal is not reachable");
  }

  const allowed = new Set<string>();
  if (!Array.isArray(challenge.allowed)) report.error("allowed", "must be an array of 1 to 5 blocks");
  else if (challenge.allowed.length < 1 || challenge.allowed.length > 5) report.error("allowed", "must be from 1 to 5");
  else {
    for (const name of challenge.allowed) {
      if (name !== "move" && name !== "turnLeft" && name !== "turnRight" && name !== "repeat" && name !== "ifPathClear") {
        report.error("allowed", "must list move, turnLeft, turnRight, repeat or ifPathClear");
      } else if (allowed.has(name)) report.error("allowed", `lists ${name} twice`);
      else allowed.add(name);
    }
  }
  const maxBlocks = whole(report, challenge.maxBlocks, "maxBlocks", 1, 14, true);
  if (!Array.isArray(challenge.solution)) report.error("solution", "must be an array of 1 to 14 blocks");
  else if (challenge.solution.length < 1 || challenge.solution.length > 14) {
    report.error("solution", "must be from 1 to 14");
  }

  let blockCount = 0;
  let tooDeep = false;
  let disallowed = false;
  const countBlock = (block: unknown, path: string, depth: number): number => {
    if (!isObj(block) || typeof block.t !== "string") {
      report.error(path, "must be a block");
      return 1;
    }
    if (block.t === "move" || block.t === "left" || block.t === "right") {
      const need = block.t === "move" ? "move" : block.t === "left" ? "turnLeft" : "turnRight";
      if (!allowed.has(need)) disallowed = true;
      return 1;
    }
    if (block.t === "repeat" || block.t === "if") {
      const need = block.t === "repeat" ? "repeat" : "ifPathClear";
      if (!allowed.has(need)) disallowed = true;
      const next = depth + 1;
      if (next > 3) tooDeep = true;
      if (block.t === "repeat") {
        whole(report, block.n, `${path}.n`, 2, 9, true);
        return 1 + countList(block.body, `${path}.body`, 1, 8, next);
      }
      return 1 + countList(block.body, `${path}.body`, 0, 8, next) + countList(block.else, `${path}.else`, 0, 8, next);
    }
    disallowed = true;
    return 1;
  };
  const countList = (list: unknown, path: string, min: number, max: number, depth: number): number => {
    if (!Array.isArray(list)) {
      report.error(path, "must be an array");
      return 0;
    }
    if (list.length < min || list.length > max) report.error(path, `must be from ${min} to ${max}`);
    return list.reduce<number>((sum, block, index) => sum + countBlock(block, `${path}[${index}]`, depth), 0);
  };
  if (Array.isArray(challenge.solution) && challenge.solution.length >= 1 && challenge.solution.length <= 14) {
    blockCount = countList(challenge.solution, "solution", 1, 14, 0);
  }
  if (disallowed) report.error("solution", solutionMessage("disallowed_block"));
  if (tooDeep) report.error("solution", solutionMessage("too_deep"));
  if (maxBlocks !== undefined && blockCount > maxBlocks) report.error("solution", solutionMessage("too_many_blocks"));

  const runnable =
    report.errors.length === 0 &&
    width !== undefined &&
    height !== undefined &&
    sx !== undefined &&
    sy !== undefined &&
    gx !== undefined &&
    gy !== undefined &&
    dir !== undefined &&
    Array.isArray(challenge.solution);

  if (runnable) {
    const free = (x: number, y: number) => inside(x, y) && !walls.has(`${x},${y}`);
    const state: ProgState = { x: sx, y: sy, dir, actions: 0, stopped: false };
    const ahead = () => {
      const [dx, dy] = DIR_DELTA[state.dir] ?? [0, 0];
      return [state.x + dx, state.y + dy] as [number, number];
    };
    const bump = () => {
      state.actions += 1;
      if (state.actions > 400) state.stopped = true;
    };
    const run = (list: unknown[]) => {
      for (const block of list) {
        if (state.stopped || !isObj(block)) return;
        if (block.t === "move") {
          bump();
          if (state.stopped) return;
          const [nx, ny] = ahead();
          if (free(nx, ny)) {
            state.x = nx;
            state.y = ny;
          }
        } else if (block.t === "left" || block.t === "right") {
          bump();
          if (state.stopped) return;
          state.dir = (block.t === "left" ? TURN_LEFT : TURN_RIGHT)[state.dir] ?? state.dir;
        } else if (block.t === "repeat" && Array.isArray(block.body) && typeof block.n === "number") {
          for (let i = 0; i < block.n; i += 1) {
            run(block.body);
            if (state.stopped) return;
          }
        } else if (block.t === "if") {
          const [nx, ny] = ahead();
          const branch = free(nx, ny) ? block.body : block.else;
          if (Array.isArray(branch)) run(branch);
        }
      }
    };
    run(challenge.solution as unknown[]);
    if (state.stopped) report.error("solution", solutionMessage("step_limit"));
    else if (state.x !== gx || state.y !== gy) report.error("solution", solutionMessage("not_at_goal"));
  }

  return report.errors.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message));
}

/** Simulation issues. An empty list means the setup is solvable. */
export function simulationIssues(sim: unknown): string[] {
  const report = new Report();
  if (!isObj(sim)) {
    report.error("sim", "is required");
    return report.errors.map((issue) => issue.message);
  }
  if (sim.kind === "projectile") {
    const gravity = finite(report, sim.gravity, "sim.gravity", 1, 25, true);
    const targetDistance = finite(report, sim.targetDistance, "sim.targetDistance", 5, 200, true);
    const tolerance = finite(report, sim.tolerance, "sim.tolerance", 0.5, 15, true);
    const maxSpeed = finite(report, sim.maxSpeed, "sim.maxSpeed", 5, 60, true);
    if (gravity !== undefined && targetDistance !== undefined && tolerance !== undefined && maxSpeed !== undefined) {
      if ((maxSpeed * maxSpeed) / gravity + tolerance < targetDistance) {
        report.error("sim", "target is out of reach");
      }
    }
  } else if (sim.kind === "lever") {
    const leftWeight = finite(report, sim.leftWeight, "sim.leftWeight", 1, 100, true);
    const leftDistance = finite(report, sim.leftDistance, "sim.leftDistance", 0.5, 10, true);
    const rightWeight = finite(report, sim.rightWeight, "sim.rightWeight", 1, 100, true);
    const maxDistance = finite(report, sim.maxDistance, "sim.maxDistance", 1, 20, true);
    finite(report, sim.tolerance, "sim.tolerance", 0.05, 2, true);
    if (leftWeight !== undefined && leftDistance !== undefined && rightWeight !== undefined && maxDistance !== undefined) {
      const balance = (leftWeight * leftDistance) / rightWeight;
      if (balance < 0.5 || balance > maxDistance) report.error("sim", "balance point is outside the lever");
    }
  } else {
    report.error("sim.kind", "must be projectile or lever");
  }
  return report.errors.map((issue) => `${issue.path}: ${issue.message}`);
}

function reachableAreaIds(areas: NArea[], doneMissions: Set<string>, doneStations: Set<string>, mechanics: string[]): Set<string> {
  const reached = new Set<string>();
  const first = areas[0];
  if (!first) return reached;
  reached.add(first.id);
  let grew = true;
  while (grew) {
    grew = false;
    for (const area of areas) {
      if (!reached.has(area.id) || !area.portal) continue;
      if (!area.portal.requires.every((id) => doneMissions.has(id))) continue;
      if (!portalEnterable(area, doneStations, mechanics)) continue;
      if (!reached.has(area.portal.toAreaId)) {
        reached.add(area.portal.toAreaId);
        grew = true;
      }
    }
  }
  return reached;
}

function portalEnterable(area: NArea, doneStations: Set<string>, mechanics: string[]): boolean {
  if (!gatesApply(area, mechanics)) return true;
  if (area.stations.length === 0) return true;
  return roomEnterable(area, area.stations.length - 1, doneStations);
}

function availableItems(area: NArea, doneStations: Set<string>, mechanics: string[]): number {
  if (area.collectCount <= 0) return 0;
  if (!gatesApply(area, mechanics)) return area.collectCount;
  const rooms = area.stations.length;
  if (rooms === 0) return 0;
  let available = 0;
  for (let item = 0; item < area.collectCount; item += 1) {
    if (roomEnterable(area, item % rooms, doneStations)) available += 1;
  }
  return available;
}

function playable(area: NArea, station: NStation, doneStations: Set<string>, unlocked: Set<string>, names: Map<string, string[]>, bosses: NBoss[], mechanics: string[]): boolean {
  if (!roomReady(area, station.index, doneStations, mechanics)) return false;
  const boss = bosses.find((item) => item.phaseStationIds.includes(station.id));
  if (boss) {
    const phase = boss.phaseStationIds.indexOf(station.id);
    for (let i = 0; i < phase; i += 1) {
      const previous = boss.phaseStationIds[i];
      if (previous && !doneStations.has(previous)) return false;
    }
  }
  const owners = names.get(station.id) ?? [];
  if (owners.length === 0) return true;
  return owners.some((missionId) => unlocked.has(missionId));
}

function roomReady(area: NArea, index: number, doneStations: Set<string>, mechanics: string[]): boolean {
  if (!gatesApply(area, mechanics)) return true;
  return roomEnterable(area, index, doneStations);
}

function missionCanFinish(mission: NMission, area: NArea | undefined, doneStations: Set<string>, bosses: NBoss[], challengeStation: Map<string, string>, mechanics: string[]): boolean {
  if (!area) return false;
  return mission.objectives.every((objective) => {
    if (objective.type === "talk") return true;
    if (objective.type === "visit") return objective.stationIds.every((id) => doneStations.has(id));
    if (objective.type === "solve") {
      return objective.challengeIds.every((id) => {
        const stationId = challengeStation.get(id);
        return stationId !== undefined && doneStations.has(stationId);
      });
    }
    if (objective.type === "collect") return availableItems(area, doneStations, mechanics) >= objective.count;
    const boss = bosses.find((item) => item.id === objective.bossId);
    return !!boss && boss.phaseStationIds.every((id) => doneStations.has(id));
  });
}

function unfinished(areas: NArea[], missions: NMission[], bosses: NBoss[], challengeStation: Map<string, string>, stationOwners: Map<string, string[]>, mechanics: string[]): string[] {
  const doneStations = new Set<string>();
  const doneMissions = new Set<string>();
  let guard = 0;
  let progressed = true;
  while (progressed && guard < 500) {
    guard += 1;
    progressed = false;
    const reached = reachableAreaIds(areas, doneMissions, doneStations, mechanics);
    const unlocked = new Set<string>();
    for (const mission of missions) {
      if (mission.requires.every((id) => doneMissions.has(id)) && reached.has(mission.areaId)) unlocked.add(mission.id);
    }
    for (const area of areas) {
      if (!reached.has(area.id)) continue;
      for (const station of area.stations) {
        if (doneStations.has(station.id)) continue;
        if (!playable(area, station, doneStations, unlocked, stationOwners, bosses, mechanics)) continue;
        doneStations.add(station.id);
        progressed = true;
      }
    }
    for (const mission of missions) {
      if (doneMissions.has(mission.id) || !unlocked.has(mission.id)) continue;
      const area = areas.find((item) => item.id === mission.areaId);
      if (!missionCanFinish(mission, area, doneStations, bosses, challengeStation, mechanics)) continue;
      doneMissions.add(mission.id);
      progressed = true;
    }
  }
  return missions.filter((mission) => !mission.optional && !doneMissions.has(mission.id)).map((mission) => mission.id);
}

export function validateGameSpec(input: unknown, options: ValidateOptions = {}): ValidationReport {
  const report = new Report();
  if (!isObj(input)) {
    report.error("", "GameSpec must be an object");
    return { ok: false, errors: report.errors, warnings: report.warnings };
  }
  const seen = new Map<string, Map<string, string>>();
  if (present(input.schemaVersion) && input.schemaVersion !== 1) {
    report.error("schemaVersion", "must be 1");
  }

  const meta = isObj(input.meta) ? input.meta : undefined;
  if (!meta) report.error("meta", "is required");
  const gameType = meta ? oneOf(report, meta.gameType, "meta.gameType", GAME_TYPES, true) : undefined;
  const difficulty = meta ? oneOf(report, meta.difficulty, "meta.difficulty", ["beginner", "intermediate", "advanced"], true) : undefined;
  if (meta) {
    text(report, meta.title, "meta.title", 80, true);
    text(report, meta.tagline, "meta.tagline", 160, true);
    text(report, meta.subject, "meta.subject", 120, true);
    oneOf(report, meta.language, "meta.language", ["he", "en", "ar", "es", "fr", "de", "ru"], true);
    const minutes = whole(report, meta.estimatedMinutes, "meta.estimatedMinutes", 2, 120, true);
    if (!present(meta.subjectCategory)) report.warn("meta.subjectCategory", "is missing");
    else oneOf(report, meta.subjectCategory, "meta.subjectCategory", ["programming", "math", "science", "history", "language", "other"], true);
    if (minutes !== undefined) {
      const shapeGuess = Array.isArray(input.areas) && input.areas.length > 1 ? "FULL" : "FAST";
      const shape = options.mode === "FULL" ? "FULL" : options.mode === "FAST" ? "FAST" : shapeGuess;
      if (shape === "FAST" && (minutes < 4 || minutes > 10)) {
        report.warn("meta.estimatedMinutes", "a Fast Game is about 4 to 10 minutes");
      }
      if (shape === "FULL" && (minutes < 12 || minutes > 30)) {
        report.warn("meta.estimatedMinutes", "a Full Adventure is about 12 to 30 minutes");
      }
    }
  }

  const learning = isObj(input.learning) ? input.learning : undefined;
  const objectiveIds = new Set<string>();
  if (!learning) report.error("learning", "is required");
  else {
    text(report, learning.goal, "learning.goal", 320, true);
    text(report, learning.conclusion, "learning.conclusion", 700, true);
    if (!Array.isArray(learning.objectives) || learning.objectives.length < 1 || learning.objectives.length > 6) {
      report.error("learning.objectives", "must be from 1 to 6");
    } else {
      learning.objectives.forEach((objective, index) => {
        const path = `learning.objectives[${index}]`;
        if (!isObj(objective)) {
          report.error(path, "must be an object");
          return;
        }
        const id = checkId(report, objective.id, `${path}.id`, "objective", seen);
        text(report, objective.text, `${path}.text`, 220, true);
        if (id) objectiveIds.add(id);
      });
    }
  }

  const theme = isObj(input.theme) ? input.theme : undefined;
  if (!theme) report.error("theme", "is required");
  else {
    oneOf(report, theme.environment, "theme.environment", ["neon-city", "forest", "space-station", "desert-ruins", "ocean-floor", "laboratory", "castle", "sky-islands"], true);
    if (!present(theme.timeOfDay)) report.warn("theme.timeOfDay", "is missing");
    else oneOf(report, theme.timeOfDay, "theme.timeOfDay", ["day", "dusk", "night"], true);
    if (present(theme.palette)) {
      if (!isObj(theme.palette)) report.error("theme.palette", "must be an object");
      else {
        color(report, theme.palette.primary, "theme.palette.primary");
        color(report, theme.palette.accent, "theme.palette.accent");
      }
    }
  }

  const mechanics: string[] = [];
  if (present(input.mechanics)) {
    if (!Array.isArray(input.mechanics)) report.error("mechanics", "must be an array");
    else {
      for (const name of input.mechanics) {
        if (typeof name !== "string" || !(MECHANICS as readonly string[]).includes(name)) {
          report.error("mechanics", `must be one of ${MECHANICS.join(", ")}`);
        } else if (mechanics.includes(name)) report.error("mechanics", `lists ${name} twice`);
        else mechanics.push(name);
      }
    }
  }

  const areas: NArea[] = [];
  if (!Array.isArray(input.areas) || input.areas.length < 1 || input.areas.length > 4) {
    report.error("areas", "must be from 1 to 4");
  } else {
    input.areas.forEach((raw, index) => {
      const path = `areas[${index}]`;
      if (!isObj(raw)) {
        report.error(path, "must be an object");
        return;
      }
      const id = checkId(report, raw.id, `${path}.id`, "area", seen);
      text(report, raw.name, `${path}.name`, 60, true);
      text(report, raw.description, `${path}.description`, 260, true);
      const layout = oneOf(report, raw.layout, `${path}.layout`, LAYOUTS, true);
      if (!present(raw.size)) report.warn(`${path}.size`, "is missing");
      else oneOf(report, raw.size, `${path}.size`, ["small", "medium", "large"], true);
      let hazardLevel: string | undefined;
      if (!present(raw.hazardLevel)) report.warn(`${path}.hazardLevel`, "is missing");
      else hazardLevel = oneOf(report, raw.hazardLevel, `${path}.hazardLevel`, ["none", "low", "high"], true);
      if (present(raw.intro)) text(report, raw.intro, `${path}.intro`, 260, true);
      let collectCount = 0;
      if (!present(raw.collectibles)) report.warn(`${path}.collectibles`, "is missing");
      else if (!isObj(raw.collectibles)) report.error(`${path}.collectibles`, "must be an object");
      else {
        oneOf(report, raw.collectibles.kind, `${path}.collectibles.kind`, ["gem", "data-core", "star", "leaf", "coin"], true);
        const count = whole(report, raw.collectibles.count, `${path}.collectibles.count`, 0, 12, true);
        text(report, raw.collectibles.label, `${path}.collectibles.label`, 40, true);
        if (count !== undefined) collectCount = count;
      }
      const stations: NStation[] = [];
      if (!Array.isArray(raw.stations) || raw.stations.length < 1 || raw.stations.length > 8) {
        report.error(`${path}.stations`, "must be from 1 to 8");
      } else {
        raw.stations.forEach((station, stationIndex) => {
          const stationPath = `${path}.stations[${stationIndex}]`;
          if (!isObj(station)) {
            report.error(stationPath, "must be an object");
            return;
          }
          const stationId = checkId(report, station.id, `${stationPath}.id`, "station", seen);
          text(report, station.label, `${stationPath}.label`, 40, true);
          if (station.kind === "challenge") {
            const challengeId = text(report, station.challengeId, `${stationPath}.challengeId`, 40, true);
            if (stationId && challengeId) {
              stations.push({ id: stationId, kind: "challenge", challengeId, index: stationIndex, path: stationPath });
            }
          } else if (station.kind === "lore") {
            text(report, station.loreTitle, `${stationPath}.loreTitle`, 70, true);
            text(report, station.loreText, `${stationPath}.loreText`, 420, true);
            if (stationId) stations.push({ id: stationId, kind: "lore", index: stationIndex, path: stationPath });
          } else report.error(`${stationPath}.kind`, "must be challenge or lore");
        });
      }
      const npcIds = new Set<string>();
      if (present(raw.npcs)) {
        if (!Array.isArray(raw.npcs) || raw.npcs.length > 3) report.error(`${path}.npcs`, "must be from 0 to 3");
        else {
          raw.npcs.forEach((npc, npcIndex) => {
            const npcPath = `${path}.npcs[${npcIndex}]`;
            if (!isObj(npc)) {
              report.error(npcPath, "must be an object");
              return;
            }
            const npcId = checkId(report, npc.id, `${npcPath}.id`, "npc", seen);
            text(report, npc.name, `${npcPath}.name`, 40, true);
            text(report, npc.role, `${npcPath}.role`, 60, true);
            if (!isObj(npc.look)) report.error(`${npcPath}.look`, "is required");
            else {
              color(report, npc.look.color, `${npcPath}.look.color`);
              oneOf(report, npc.look.shape, `${npcPath}.look.shape`, ["robot", "human", "creature", "orb"], true);
            }
            if (!Array.isArray(npc.lines) || npc.lines.length < 1 || npc.lines.length > 5) {
              report.error(`${npcPath}.lines`, "must be from 1 to 5");
            } else npc.lines.forEach((line, lineIndex) => text(report, line, `${npcPath}.lines[${lineIndex}]`, 240, true));
            if (present(npc.hint)) text(report, npc.hint, `${npcPath}.hint`, 220, true);
            if (present(npc.reactions)) {
              if (!Array.isArray(npc.reactions) || npc.reactions.length > 3) report.error(`${npcPath}.reactions`, "must be from 0 to 3");
              else {
                npc.reactions.forEach((reaction, reactionIndex) => {
                  const reactionPath = `${npcPath}.reactions[${reactionIndex}]`;
                  if (!isObj(reaction)) {
                    report.error(reactionPath, "must be an object");
                    return;
                  }
                  text(report, reaction.afterMissionId, `${reactionPath}.afterMissionId`, 40, true);
                  if (!Array.isArray(reaction.lines) || reaction.lines.length < 1 || reaction.lines.length > 3) {
                    report.error(`${reactionPath}.lines`, "must be from 1 to 3");
                  } else reaction.lines.forEach((line, lineIndex) => text(report, line, `${reactionPath}.lines[${lineIndex}]`, 240, true));
                });
              }
            }
            if (npcId) npcIds.add(npcId);
          });
        }
      }
      let portal: NPortal | undefined;
      if (present(raw.portal)) {
        if (!isObj(raw.portal)) report.error(`${path}.portal`, "must be an object");
        else {
          const toAreaId = text(report, raw.portal.toAreaId, `${path}.portal.toAreaId`, 40, true) ?? "";
          text(report, raw.portal.label, `${path}.portal.label`, 50, true);
          const requires: string[] = [];
          if (present(raw.portal.requiresMissionIds)) {
            if (!Array.isArray(raw.portal.requiresMissionIds) || raw.portal.requiresMissionIds.length > 4) {
              report.error(`${path}.portal.requiresMissionIds`, "must be from 0 to 4");
            } else {
              raw.portal.requiresMissionIds.forEach((missionId, missionIndex) => {
                const checked = text(report, missionId, `${path}.portal.requiresMissionIds[${missionIndex}]`, 40, true);
                if (checked) requires.push(checked);
              });
            }
          }
          portal = { toAreaId, requires, path: `${path}.portal` };
        }
      }
      if (id && layout) {
        areas.push({ id, index, layout, hazardLevel, stations, npcIds, collectCount, portal, path });
      }
    });
  }

  const missions: NMission[] = [];
  if (!Array.isArray(input.missions) || input.missions.length < 1 || input.missions.length > 8) {
    report.error("missions", "must be from 1 to 8");
  } else {
    input.missions.forEach((raw, index) => {
      const path = `missions[${index}]`;
      if (!isObj(raw)) {
        report.error(path, "must be an object");
        return;
      }
      const id = checkId(report, raw.id, `${path}.id`, "mission", seen);
      text(report, raw.title, `${path}.title`, 80, true);
      text(report, raw.story, `${path}.story`, 320, true);
      const areaId = text(report, raw.areaId, `${path}.areaId`, 40, true) ?? "";
      const requires: string[] = [];
      if (present(raw.requires)) {
        if (!Array.isArray(raw.requires) || raw.requires.length > 4) report.error(`${path}.requires`, "must be from 0 to 4");
        else {
          raw.requires.forEach((missionId, missionIndex) => {
            const checked = text(report, missionId, `${path}.requires[${missionIndex}]`, 40, true);
            if (checked) requires.push(checked);
          });
        }
      }
      const optional = raw.optional === true;
      if (present(raw.optional) && typeof raw.optional !== "boolean") report.error(`${path}.optional`, "must be a boolean");
      const objectives: NObjective[] = [];
      if (!Array.isArray(raw.objectives) || raw.objectives.length < 1 || raw.objectives.length > 4) {
        report.error(`${path}.objectives`, "must be from 1 to 4");
      } else {
        raw.objectives.forEach((objective, objectiveIndex) => {
          const objectivePath = `${path}.objectives[${objectiveIndex}]`;
          if (!isObj(objective)) {
            report.error(objectivePath, "must be an object");
            return;
          }
          text(report, objective.text, `${objectivePath}.text`, 200, true);
          if (objective.type === "solve") {
            const challengeIds: string[] = [];
            if (!Array.isArray(objective.challengeIds) || objective.challengeIds.length < 1 || objective.challengeIds.length > 6) {
              report.error(`${objectivePath}.challengeIds`, "must be from 1 to 6");
            } else {
              objective.challengeIds.forEach((challengeId, challengeIndex) => {
                const checked = text(report, challengeId, `${objectivePath}.challengeIds[${challengeIndex}]`, 40, true);
                if (checked) challengeIds.push(checked);
              });
            }
            objectives.push({ type: "solve", challengeIds, path: objectivePath });
          } else if (objective.type === "collect") {
            const count = whole(report, objective.count, `${objectivePath}.count`, 1, 12, true) ?? 0;
            objectives.push({ type: "collect", count, path: objectivePath });
          } else if (objective.type === "talk") {
            const npcId = text(report, objective.npcId, `${objectivePath}.npcId`, 40, true) ?? "";
            objectives.push({ type: "talk", npcId, path: objectivePath });
          } else if (objective.type === "visit") {
            const stationIds: string[] = [];
            if (!Array.isArray(objective.stationIds) || objective.stationIds.length < 1 || objective.stationIds.length > 4) {
              report.error(`${objectivePath}.stationIds`, "must be from 1 to 4");
            } else {
              objective.stationIds.forEach((stationId, stationIndex) => {
                const checked = text(report, stationId, `${objectivePath}.stationIds[${stationIndex}]`, 40, true);
                if (checked) stationIds.push(checked);
              });
            }
            objectives.push({ type: "visit", stationIds, path: objectivePath });
          } else if (objective.type === "defeat") {
            const bossId = text(report, objective.bossId, `${objectivePath}.bossId`, 40, true) ?? "";
            objectives.push({ type: "defeat", bossId, path: objectivePath });
          } else report.error(`${objectivePath}.type`, "must be solve, collect, talk, visit or defeat");
        });
      }
      if (id) missions.push({ id, index, areaId, requires, optional, objectives, path });
    });
  }

  const challenges: NChallenge[] = [];
  const challengeRaw = new Map<string, Dict>();
  if (!Array.isArray(input.challenges) || input.challenges.length < 1 || input.challenges.length > 24) {
    report.error("challenges", "must be from 1 to 24");
  } else {
    input.challenges.forEach((raw, index) => {
      const path = `challenges[${index}]`;
      if (!isObj(raw)) {
        report.error(path, "must be an object");
        return;
      }
      const type = oneOf(report, raw.type, `${path}.type`, CHALLENGE_TYPES, true);
      const id = checkId(report, raw.id, `${path}.id`, "challenge", seen);
      text(report, raw.title, `${path}.title`, 80, true);
      text(report, raw.prompt, `${path}.prompt`, 600, true);
      text(report, raw.concept, `${path}.concept`, 60, true);
      const explanation = text(report, raw.explanation, `${path}.explanation`, 600, true);
      if (explanation !== undefined && [...explanation].length < 40) {
        report.warn(`${path}.explanation`, "should teach why, in at least 40 characters");
      }
      let level: number | undefined;
      if (!present(raw.level)) report.warn(`${path}.level`, "is missing");
      else level = whole(report, raw.level, `${path}.level`, 1, 3, true);
      let objectiveId: string | undefined;
      if (!present(raw.objectiveId)) report.warn(`${path}.objectiveId`, "is missing");
      else {
        objectiveId = text(report, raw.objectiveId, `${path}.objectiveId`, 40, true);
        if (objectiveId && !objectiveIds.has(objectiveId)) report.error(`${path}.objectiveId`, "unknown learning objective");
      }
      if (!present(raw.hint)) report.warn(`${path}.hint`, "is missing");
      else text(report, raw.hint, `${path}.hint`, 260, true);
      if (present(raw.timeLimitSec)) whole(report, raw.timeLimitSec, `${path}.timeLimitSec`, 10, 180, true);
      const easierId = present(raw.easierId) ? text(report, raw.easierId, `${path}.easierId`, 40, true) : undefined;
      const harderId = present(raw.harderId) ? text(report, raw.harderId, `${path}.harderId`, 40, true) : undefined;
      if (type === "choice") checkChoice(report, raw, path);
      if (type === "numeric") checkNumeric(report, raw, path);
      if (type === "sequence") checkSequence(report, raw, path);
      if (type === "match") checkMatch(report, raw, path);
      if (type === "program") {
        for (const message of traceProgram(raw)) report.error(path, message);
      }
      if (type === "simulation") {
        for (const message of simulationIssues(raw.sim)) report.error(`${path}.${message.split(":")[0]}`, message.includes(":") ? message.slice(message.indexOf(":") + 2) : message);
      }
      if (id && type) {
        challenges.push({ id, type, level, objectiveId, easierId, harderId, path });
        challengeRaw.set(id, raw);
      }
    });
  }

  const bosses: NBoss[] = [];
  if (present(input.bosses)) {
    if (!Array.isArray(input.bosses) || input.bosses.length > 3) report.error("bosses", "must be from 0 to 3");
    else {
      input.bosses.forEach((raw, index) => {
        const path = `bosses[${index}]`;
        if (!isObj(raw)) {
          report.error(path, "must be an object");
          return;
        }
        const id = checkId(report, raw.id, `${path}.id`, "boss", seen);
        const areaId = text(report, raw.areaId, `${path}.areaId`, 40, true) ?? "";
        text(report, raw.name, `${path}.name`, 40, true);
        text(report, raw.title, `${path}.title`, 70, true);
        text(report, raw.intro, `${path}.intro`, 260, true);
        text(report, raw.defeatLine, `${path}.defeatLine`, 200, true);
        if (!isObj(raw.look)) report.error(`${path}.look`, "is required");
        else {
          color(report, raw.look.color, `${path}.look.color`);
          oneOf(report, raw.look.shape, `${path}.look.shape`, ["robot", "human", "creature", "orb"], true);
        }
        const phaseStationIds: string[] = [];
        if (!Array.isArray(raw.phaseStationIds) || raw.phaseStationIds.length < 2 || raw.phaseStationIds.length > 5) {
          report.error(`${path}.phaseStationIds`, "must be from 2 to 5");
        } else {
          raw.phaseStationIds.forEach((stationId, stationIndex) => {
            const checked = text(report, stationId, `${path}.phaseStationIds[${stationIndex}]`, 40, true);
            if (checked) phaseStationIds.push(checked);
          });
        }
        if (id) bosses.push({ id, areaId, phaseStationIds, path });
      });
    }
  }

  crossCheck(report, input, options, { areas, missions, challenges, bosses, mechanics, gameType, difficulty, objectiveIds });
  return { ok: report.errors.length === 0, errors: report.errors, warnings: report.warnings };
}

function checkChoice(report: Report, raw: Dict, path: string) {
  if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > 5) {
    report.error(`${path}.options`, "must be from 2 to 5");
    return;
  }
  const ids = new Set<string>();
  const texts = new Set<string>();
  for (let index = 0; index < raw.options.length; index += 1) {
    const option = raw.options[index];
    const optionPath = `${path}.options[${index}]`;
    if (!isObj(option)) {
      report.error(optionPath, "must be an object");
      continue;
    }
    const id = text(report, option.id, `${optionPath}.id`, 40, true);
    const label = text(report, option.text, `${optionPath}.text`, 220, true);
    text(report, option.feedback, `${optionPath}.feedback`, 320, true);
    if (id) {
      if (ids.has(id)) report.error(`${optionPath}.id`, "duplicates an option id");
      ids.add(id);
    }
    if (label) {
      const key = normalizeSpace(label);
      if (texts.has(key)) report.error(`${optionPath}.text`, "has two options with the same text");
      texts.add(key);
    }
  }
  const correct = text(report, raw.correctOptionId, `${path}.correctOptionId`, 40, true);
  if (correct && !ids.has(correct)) report.error(`${path}.correctOptionId`, "is not one of the options");
}

function checkNumeric(report: Report, raw: Dict, path: string) {
  const answer = finite(report, raw.answer, `${path}.answer`, -1_000_000_000, 1_000_000_000, true);
  let tolerance = 0;
  if (!present(raw.tolerance)) report.warn(`${path}.tolerance`, "is missing");
  else {
    const parsed = finite(report, raw.tolerance, `${path}.tolerance`, 0, 1_000_000, true);
    if (parsed !== undefined) tolerance = parsed;
  }
  if (present(raw.unit)) text(report, raw.unit, `${path}.unit`, 12, true);
  if (present(raw.commonMistakes)) {
    if (!Array.isArray(raw.commonMistakes) || raw.commonMistakes.length > 3) {
      report.error(`${path}.commonMistakes`, "must be from 0 to 3");
    } else {
      raw.commonMistakes.forEach((mistake, index) => {
        const mistakePath = `${path}.commonMistakes[${index}]`;
        if (!isObj(mistake)) {
          report.error(mistakePath, "must be an object");
          return;
        }
        const value = finite(report, mistake.value, `${mistakePath}.value`, -1_000_000_000, 1_000_000_000, true);
        text(report, mistake.feedback, `${mistakePath}.feedback`, 260, true);
        if (answer !== undefined && value !== undefined && Math.abs(value - answer) <= tolerance) {
          report.error(`${mistakePath}.value`, `lists the correct answer ${answer} as a common mistake`);
        }
      });
    }
  }
}

function checkSequence(report: Report, raw: Dict, path: string) {
  if (!Array.isArray(raw.items) || raw.items.length < 3 || raw.items.length > 6) {
    report.error(`${path}.items`, "must be from 3 to 6");
    return;
  }
  const ids = new Set<string>();
  const texts = new Set<string>();
  raw.items.forEach((item, index) => {
    const itemPath = `${path}.items[${index}]`;
    if (!isObj(item)) {
      report.error(itemPath, "must be an object");
      return;
    }
    const id = text(report, item.id, `${itemPath}.id`, 40, true);
    const label = text(report, item.text, `${itemPath}.text`, 180, true);
    if (id) {
      if (ids.has(id)) report.error(`${itemPath}.id`, "duplicates an item id");
      ids.add(id);
    }
    if (label) {
      const key = normalizeSpace(label);
      if (texts.has(key)) report.warn(`${itemPath}.text`, "repeats a sequence item");
      texts.add(key);
    }
  });
}

function checkMatch(report: Report, raw: Dict, path: string) {
  if (!Array.isArray(raw.pairs) || raw.pairs.length < 3 || raw.pairs.length > 6) {
    report.error(`${path}.pairs`, "must be from 3 to 6");
    return;
  }
  const ids = new Set<string>();
  const lefts = new Set<string>();
  const rights = new Set<string>();
  raw.pairs.forEach((pair, index) => {
    const pairPath = `${path}.pairs[${index}]`;
    if (!isObj(pair)) {
      report.error(pairPath, "must be an object");
      return;
    }
    const id = text(report, pair.id, `${pairPath}.id`, 40, true);
    const left = text(report, pair.left, `${pairPath}.left`, 90, true);
    const right = text(report, pair.right, `${pairPath}.right`, 140, true);
    if (id) {
      if (ids.has(id)) report.error(`${pairPath}.id`, "duplicates a pair id");
      ids.add(id);
    }
    if (left) {
      const key = normalizeSpace(left);
      if (lefts.has(key)) report.warn(`${pairPath}.left`, "repeats a match side");
      lefts.add(key);
    }
    if (right) {
      const key = normalizeSpace(right);
      if (rights.has(key)) report.warn(`${pairPath}.right`, "repeats a match side");
      rights.add(key);
    }
  });
}

function crossCheck(
  report: Report,
  input: Dict,
  options: ValidateOptions,
  model: {
    areas: NArea[];
    missions: NMission[];
    challenges: NChallenge[];
    bosses: NBoss[];
    mechanics: string[];
    gameType?: string;
    difficulty?: string;
    objectiveIds: Set<string>;
  },
) {
  const { areas, missions, challenges, bosses, mechanics, gameType, difficulty, objectiveIds } = model;
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const missionById = new Map(missions.map((mission) => [mission.id, mission]));
  const challengeById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
  const stationById = new Map<string, { area: NArea; station: NStation }>();
  for (const area of areas) {
    for (const station of area.stations) stationById.set(station.id, { area, station });
  }

  const shape: "FAST" | "FULL" =
    options.mode === "FULL" ? "FULL" : options.mode === "FAST" ? "FAST" : areas.length > 1 ? "FULL" : "FAST";
  const placedCount = areas.reduce((sum, area) => sum + area.stations.filter((station) => station.kind === "challenge").length, 0);
  if (shape === "FAST") {
    if (areas.length !== 1) report.error("areas", "FAST has exactly 1 area");
    if (placedCount < 3 || placedCount > 6) report.error("areas", "FAST has 3 to 6 challenge stations");
    if (areas.some((area) => area.portal)) report.error("areas", "FAST has no portal");
  } else {
    if (areas.length < 2) report.error("areas", "FULL needs at least 2 areas");
    if (missions.length < 4) report.error("missions", "FULL needs at least 4 missions");
    if (placedCount < 8) report.error("challenges", "FULL needs at least 8 placed challenges");
  }

  if (options.tier) {
    const tier = options.tier;
    if (gameType && !allowedGameTypes(tier).includes(gameType)) {
      report.error("meta.gameType", `game type ${gameType} is outside tier ${tier}`);
    }
    if (!tierAllows("B", tier) && shape === "FULL") report.error("meta", "tier C is FAST only");
    if (tier === "C" && areas.length !== 1) report.error("areas", "tier C has 1 area");
    if (tier === "B" && areas.length > 2) report.error("areas", "tier B has at most 2 areas");
    if (tier === "B" && shape === "FULL" && areas.length !== 2) report.error("areas", "a FULL game at tier B has exactly 2 areas");
    const challengeTypes = new Set(allowedChallengeTypes(tier));
    for (const challenge of challenges) {
      if (!challengeTypes.has(challenge.type)) report.error(challenge.path, `${challenge.type} is outside tier ${tier}`);
    }
    const mechanicTypes = new Set(allowedMechanics(tier));
    for (const mechanic of mechanics) {
      if (!mechanicTypes.has(mechanic)) report.error("mechanics", `${mechanic} is outside tier ${tier}`);
    }
    if (!tierAllows("A", tier) && bosses.length > 0) report.error("bosses", `bosses are outside tier ${tier}`);
    if (!tierAllows("B", tier)) {
      for (const mission of missions) {
        if (mission.optional) report.error(mission.path, "side missions are outside tier C");
      }
    }
    if (!tierAllows("A", tier) && isObj(input) && Array.isArray(input.areas)) {
      input.areas.forEach((area, areaIndex) => {
        if (!isObj(area) || !Array.isArray(area.npcs)) return;
        area.npcs.forEach((npc, npcIndex) => {
          if (isObj(npc) && present(npc.reactions)) {
            report.error(`areas[${areaIndex}].npcs[${npcIndex}].reactions`, `reactions are outside tier ${tier}`);
          }
        });
      });
    }
    for (const area of areas) {
      if ((area.hazardLevel === "low" || area.hazardLevel === "high") && !tierAllows("B", tier)) {
        report.error(area.path, `hazardLevel is outside tier ${tier}`);
      }
    }
    if (Array.isArray(input.challenges)) {
      input.challenges.forEach((challenge, index) => {
        if (!isObj(challenge)) return;
        if (present(challenge.timeLimitSec) && !tierAllows("B", tier)) {
          report.error(`challenges[${index}].timeLimitSec`, `time limits are outside tier ${tier}`);
        }
        if ((present(challenge.easierId) || present(challenge.harderId)) && !tierAllows("A", tier)) {
          report.error(`challenges[${index}]`, `variants are outside tier ${tier}`);
        }
        if (options.device === "phone" && typeof challenge.timeLimitSec === "number" && challenge.timeLimitSec < 30) {
          report.error(`challenges[${index}].timeLimitSec`, "on a phone every time limit is at least 30 seconds");
        }
      });
    }
  } else if (options.device === "phone" && Array.isArray(input.challenges)) {
    input.challenges.forEach((challenge, index) => {
      if (isObj(challenge) && typeof challenge.timeLimitSec === "number" && challenge.timeLimitSec < 30) {
        report.error(`challenges[${index}].timeLimitSec`, "on a phone every time limit is at least 30 seconds");
      }
    });
  }

  if (options.device === "phone") {
    if (mechanics.includes("moving_platforms")) report.error("mechanics", "a phone game has no moving platforms");
    for (const area of areas) {
      if (area.hazardLevel === "high") report.error(area.path, "a phone game keeps hazards low");
      if (area.collectCount > 8) report.warn(area.path, "a phone keeps at most 8 collectibles in an area");
    }
    const heavy = challenges.filter((challenge) => challenge.type === "program" || challenge.type === "simulation").length;
    if (heavy > 1) report.warn("challenges", "a phone game has at most one program or simulation");
  }

  if (gameType) {
    const expected = LAYOUT_FOR_TYPE[gameType];
    if (expected) {
      for (const area of areas) {
        if (area.layout !== expected) report.warn(area.path, `${gameType} uses the ${expected} layout`);
      }
    }
  }
  if (areas.some((area) => area.layout === "rooms" || area.layout === "corridor") && !mechanics.includes("gates")) {
    report.warn("mechanics", "rooms stay open until gates is declared");
  }
  for (const mechanic of mechanics) {
    const supported =
      mechanic === "hazards"
        ? areas.some((area) => (area.layout === "plaza" || area.layout === "terraces") && (area.hazardLevel === "low" || area.hazardLevel === "high"))
        : mechanic === "checkpoints"
          ? areas.some((area) => area.layout === "plaza" || area.layout === "terraces" || area.layout === "corridor")
          : mechanic === "moving_platforms"
            ? areas.some((area) => area.layout === "terraces")
            : mechanic === "gates"
              ? areas.some((area) => area.layout === "rooms" || area.layout === "corridor")
              : true;
    if (!supported) report.warn("mechanics", `no area supports ${mechanic}`);
  }
  for (const area of areas) {
    if ((area.hazardLevel === "low" || area.hazardLevel === "high") && area.layout !== "plaza" && area.layout !== "terraces") {
      report.error(area.path, "hazards only in plaza or terraces");
    }
  }

  const placements = new Map<string, string[]>();
  for (const area of areas) {
    for (const station of area.stations) {
      if (station.kind !== "challenge" || !station.challengeId) continue;
      const list = placements.get(station.challengeId) ?? [];
      list.push(station.path);
      placements.set(station.challengeId, list);
      if (!challengeById.has(station.challengeId)) report.error(station.path, "unknown challenge id");
    }
  }
  const parents = new Map<string, string[]>();
  for (const challenge of challenges) {
    for (const variantId of [challenge.easierId, challenge.harderId]) {
      if (!variantId) continue;
      if (variantId === challenge.id) {
        report.error(challenge.path, "names itself");
        continue;
      }
      if (!challengeById.has(variantId)) report.error(challenge.path, "unknown challenge id");
      const list = parents.get(variantId) ?? [];
      list.push(challenge.id);
      parents.set(variantId, list);
    }
  }
  const variantIds = new Set([...parents.keys()].filter((id) => (parents.get(id) ?? []).length >= 1));
  for (const [variantId, bases] of parents) {
    if (bases.length > 1) report.error(challengeById.get(variantId)?.path ?? variantId, "is named by more than one challenge");
  }
  const variantGraph = new Map<string, string[]>();
  for (const challenge of challenges) {
    const next = [challenge.easierId, challenge.harderId].filter((id): id is string => !!id && id !== challenge.id);
    variantGraph.set(challenge.id, next);
  }
  const color = new Map<string, number>();
  const visitVariant = (id: string): boolean => {
    const state = color.get(id) ?? 0;
    if (state === 1) return true;
    if (state === 2) return false;
    color.set(id, 1);
    for (const next of variantGraph.get(id) ?? []) {
      if (visitVariant(next)) return true;
    }
    color.set(id, 2);
    return false;
  };
  if ([...variantGraph.keys()].some((id) => visitVariant(id))) report.error("challenges", "variant links form a cycle");
  for (const challenge of challenges) {
    const places = placements.get(challenge.id) ?? [];
    const isVariant = variantIds.has(challenge.id) && challenge.easierId !== challenge.id;
    if (places.length > 1) report.error(challenge.path, "is placed on more than one station");
    else if (places.length === 1 && isVariant) report.error(challenge.path, "a variant is placed on a station");
    else if (places.length === 0 && !isVariant) report.error(challenge.path, "is not placed on any station");
    if (challenge.easierId && challenge.easierId !== challenge.id) {
      const easier = challengeById.get(challenge.easierId);
      if (easier && challenge.level !== undefined && easier.level !== undefined && easier.level !== challenge.level - 1) {
        report.warn(challenge.path, "an easier variant is one level lower");
      }
    }
    if (challenge.harderId && challenge.harderId !== challenge.id) {
      const harder = challengeById.get(challenge.harderId);
      if (harder && challenge.level !== undefined && harder.level !== undefined && (harder.level < challenge.level || harder.level > challenge.level + 1)) {
        report.warn(challenge.path, "a harder variant is at most one level higher");
      }
    }
  }

  const solved = new Set<string>();
  const visited = new Set<string>();
  for (const mission of missions) {
    const area = areaById.get(mission.areaId);
    if (!area) report.error(mission.path, "has no station in area");
    const missionAreaIndex = area?.index ?? -1;
    for (const requiredId of mission.requires) {
      if (requiredId === mission.id) continue;
      const required = missionById.get(requiredId);
      if (!required) {
        report.error(mission.path, "unknown mission id");
        continue;
      }
      if (required.optional) report.error(mission.path, "nothing requires a side mission");
      const requiredArea = areaById.get(required.areaId);
      if (requiredArea && missionAreaIndex >= 0 && requiredArea.index > missionAreaIndex) {
        report.error(mission.path, "can never be completed because portals only lead forward");
      }
      if (required.index > mission.index) report.warn(mission.path, "list this mission after the missions it requires");
    }
    for (const objective of mission.objectives) {
      if (!area) continue;
      if (objective.type === "solve") {
        for (const challengeId of objective.challengeIds) {
          solved.add(challengeId);
          const challenge = challengeById.get(challengeId);
          if (!challenge) {
            report.error(objective.path, "unknown challenge id");
            continue;
          }
          if (variantIds.has(challengeId)) {
            report.error(objective.path, "solve objectives cannot name a variant");
            continue;
          }
          const places = placements.get(challengeId) ?? [];
          const station = area.stations.find((item) => item.kind === "challenge" && item.challengeId === challengeId);
          if (!station || places.length === 0) report.error(objective.path, "has no station in area");
        }
      } else if (objective.type === "visit") {
        for (const stationId of objective.stationIds) {
          visited.add(stationId);
          const found = stationById.get(stationId);
          if (!found || found.area.id !== area.id) report.error(objective.path, "has no station in area");
          else if (found.station.kind !== "lore") report.error(objective.path, "is not a lore station");
        }
      } else if (objective.type === "talk") {
        if (!area.npcIds.has(objective.npcId)) report.error(objective.path, "is not an NPC of this area");
      } else if (objective.type === "collect") {
        if (objective.count > area.collectCount) report.error(objective.path, `collectibles only has ${area.collectCount}`);
      } else if (!bosses.some((boss) => boss.id === objective.bossId && boss.areaId === area.id)) {
        report.error(objective.path, "is not a boss of this area");
      }
    }
  }

  const requiresGraph = new Map(missions.map((mission) => [mission.id, mission.requires.filter((id) => id !== mission.id)]));
  const mark = new Map<string, number>();
  const hasCycle = (id: string): boolean => {
    const state = mark.get(id) ?? 0;
    if (state === 1) return true;
    if (state === 2) return false;
    mark.set(id, 1);
    for (const next of requiresGraph.get(id) ?? []) {
      if (missionById.has(next) && hasCycle(next)) return true;
    }
    mark.set(id, 2);
    return false;
  };
  if (missions.some((mission) => mission.requires.includes(mission.id) || hasCycle(mission.id))) {
    report.error("missions", "requires form a cycle");
  }

  const areaIds = new Set(areas.map((area) => area.id));
  for (const area of areas) {
    if (!area.portal) continue;
    if (area.index === areas.length - 1) report.error(area.portal.path, "the last area has a portal");
    if (!areaIds.has(area.portal.toAreaId) || area.portal.toAreaId === area.id) {
      report.error(area.portal.path, "can never be completed because portals only lead forward");
      continue;
    }
    const target = areaById.get(area.portal.toAreaId);
    if (target && target.index <= area.index) {
      report.error(area.portal.path, "can never be completed because portals only lead forward");
    }
    for (const missionId of area.portal.requires) {
      const mission = missionById.get(missionId);
      if (!mission || mission.areaId !== area.id || mission.optional) {
        report.error(area.portal.path, "requires a mission from this area");
      }
    }
    const lastRequired = [...missions].reverse().find((mission) => mission.areaId === area.id && !mission.optional);
    if (lastRequired && !area.portal.requires.includes(lastRequired.id)) {
      report.warn(area.portal.path, "name the area's last required mission");
    }
  }
  const chained = new Set<string>();
  if (areas[0]) chained.add(areas[0].id);
  let grew = true;
  while (grew) {
    grew = false;
    for (const area of areas) {
      if (!chained.has(area.id) || !area.portal) continue;
      const target = areaById.get(area.portal.toAreaId);
      if (target && target.index > area.index && !chained.has(target.id)) {
        chained.add(target.id);
        grew = true;
      }
    }
  }
  for (const area of areas) {
    if (!chained.has(area.id)) report.error(area.path, "cannot be reached");
  }

  const phaseOwner = new Map<string, string>();
  for (const boss of bosses) {
    if (!areaById.has(boss.areaId)) report.error(boss.path, "unknown area id");
    const phaseChallenges: string[] = [];
    let previousLevel = -1;
    for (const stationId of boss.phaseStationIds) {
      const found = stationById.get(stationId);
      if (!found || found.area.id !== boss.areaId || found.station.kind !== "challenge") {
        report.error(boss.path, "phase is not a challenge station of this area");
        continue;
      }
      const previousBoss = phaseOwner.get(stationId);
      if (previousBoss) report.error(boss.path, "belongs to more than one boss");
      phaseOwner.set(stationId, boss.id);
      if (found.station.challengeId) {
        phaseChallenges.push(found.station.challengeId);
        const level = challengeById.get(found.station.challengeId)?.level;
        if (level !== undefined) {
          if (previousLevel >= 0 && level < previousLevel) report.warn(boss.path, "list boss phases easiest first");
          previousLevel = level;
        }
      }
    }
    const patterned = missions.some(
      (mission) =>
        mission.areaId === boss.areaId &&
        mission.objectives.some((objective) => objective.type === "defeat" && objective.bossId === boss.id) &&
        mission.objectives.some(
          (objective) => objective.type === "solve" && phaseChallenges.every((id) => objective.challengeIds.includes(id)),
        ),
    );
    if (phaseChallenges.length > 0 && !patterned) {
      report.warn(boss.path, "put the phases and the defeat in one mission");
    }
  }

  for (const area of areas) {
    let previous = -1;
    for (const station of area.stations) {
      if (station.kind !== "challenge" || !station.challengeId) continue;
      const level = challengeById.get(station.challengeId)?.level;
      if (level === undefined) continue;
      if (previous >= 0 && level < previous) report.warn(station.path, "levels never fall inside an area");
      previous = level;
    }
  }
  const levels = challenges
    .filter((challenge) => (placements.get(challenge.id) ?? []).length === 1 && challenge.level !== undefined)
    .map((challenge) => challenge.level as number);
  if (levels.length > 0 && difficulty === "beginner" && Math.max(...levels) < 2) {
    report.warn("challenges", "a beginner game climbs to at least level 2");
  }
  if (levels.length > 0 && (difficulty === "intermediate" || difficulty === "advanced") && Math.max(...levels) < 3) {
    report.warn("challenges", "this difficulty climbs to level 3");
  }
  for (const id of objectiveIds) {
    if (!challenges.some((challenge) => challenge.objectiveId === id)) {
      report.warn("learning.objectives", `no challenge assesses ${id}`);
    }
  }
  for (const [challengeId, places] of placements) {
    if (places.length === 1 && !solved.has(challengeId)) {
      report.warn(places[0] ?? challengeId, "placed challenge is outside every solve objective");
    }
  }
  for (const area of areas) {
    for (const station of area.stations) {
      if (station.kind === "lore" && !visited.has(station.id)) {
        report.warn(station.path, "lore station is outside every visit objective");
      }
    }
  }
  if (shape === "FAST") {
    const lore = areas.reduce((sum, area) => sum + area.stations.filter((station) => station.kind === "lore").length, 0);
    if (lore > 1) report.warn("areas", "FAST allows at most 1 lore station");
    const optional = missions.filter((mission) => mission.optional).length;
    const required = missions.length - optional;
    if (optional > 1) report.warn("missions", "FAST allows at most 1 side mission");
    if (required < 2 || required > 3) report.warn("missions", "FAST has 2 or 3 required missions");
    for (const area of areas) {
      if (area.collectCount > 5) report.warn(area.path, "FAST has at most 5 collectibles");
    }
  }

  const playOrder: string[] = [];
  for (const area of areas) {
    for (const station of area.stations) {
      if (station.kind === "challenge" && station.challengeId) playOrder.push(station.challengeId);
    }
  }
  for (const challenge of challenges) {
    if (!challenge.harderId) continue;
    const position = playOrder.indexOf(challenge.id);
    if (position >= 0 && position < 3) report.warn(challenge.path, "a harder variant comes after at least three challenges");
  }

  if (isObj(input) && Array.isArray(input.areas)) {
    input.areas.forEach((area, areaIndex) => {
      if (!isObj(area) || !Array.isArray(area.npcs)) return;
      area.npcs.forEach((npc, npcIndex) => {
        if (!isObj(npc) || !Array.isArray(npc.reactions)) return;
        npc.reactions.forEach((reaction, reactionIndex) => {
          if (!isObj(reaction) || typeof reaction.afterMissionId !== "string") return;
          if (!missionById.has(reaction.afterMissionId)) {
            report.error(`areas[${areaIndex}].npcs[${npcIndex}].reactions[${reactionIndex}].afterMissionId`, "unknown mission id");
          }
        });
      });
    });
  }

  const challengeStation = new Map<string, string>();
  const stationOwners = new Map<string, string[]>();
  for (const area of areas) {
    for (const station of area.stations) {
      if (station.kind === "challenge" && station.challengeId && (placements.get(station.challengeId) ?? []).length === 1) {
        challengeStation.set(station.challengeId, station.id);
      }
    }
  }
  for (const mission of missions) {
    for (const objective of mission.objectives) {
      if (objective.type === "solve") {
        for (const challengeId of objective.challengeIds) {
          const stationId = challengeStation.get(challengeId);
          if (!stationId) continue;
          const owners = stationOwners.get(stationId) ?? [];
          owners.push(mission.id);
          stationOwners.set(stationId, owners);
        }
      } else if (objective.type === "visit") {
        for (const stationId of objective.stationIds) {
          const owners = stationOwners.get(stationId) ?? [];
          owners.push(mission.id);
          stationOwners.set(stationId, owners);
        }
      }
    }
  }
  if (areas.length > 0 && missions.length > 0 && report.errors.length === 0) {
    for (const missionId of unfinished(areas, missions, bosses, challengeStation, stationOwners, mechanics)) {
      report.error(missionById.get(missionId)?.path ?? "missions", "cannot be finished");
    }
  }
}

export function clampToTier(input: unknown, tier: Tier): ClampResult {
  if (!isObj(input)) return { ok: false, errors: [{ path: "", message: "GameSpec must be an object" }] };
  const spec = structuredClone(input);
  const meta = isObj(spec.meta) ? spec.meta : undefined;
  const gameType = meta && typeof meta.gameType === "string" ? meta.gameType : "";
  if (!allowedGameTypes(tier).includes(gameType)) {
    return { ok: false, errors: [{ path: "meta.gameType", message: `game type ${gameType} is outside tier ${tier}` }] };
  }
  const allowedTypes = new Set(allowedChallengeTypes(tier));
  const removed = new Set<string>();
  if (Array.isArray(spec.challenges)) {
    spec.challenges = spec.challenges.filter((challenge) => {
      if (!isObj(challenge) || typeof challenge.type !== "string" || typeof challenge.id !== "string") return false;
      if (!allowedTypes.has(challenge.type)) {
        removed.add(challenge.id);
        return false;
      }
      if (tier !== "A") {
        delete challenge.easierId;
        delete challenge.harderId;
      }
      if (tier === "C") delete challenge.timeLimitSec;
      return true;
    });
  }
  if (Array.isArray(spec.areas)) {
    for (const area of spec.areas) {
      if (!isObj(area)) continue;
      if (Array.isArray(area.stations)) {
        area.stations = area.stations.filter((station) => {
          if (!isObj(station)) return false;
          return !(station.kind === "challenge" && typeof station.challengeId === "string" && removed.has(station.challengeId));
        });
      }
      if (tier === "C") {
        if (area.hazardLevel === "low" || area.hazardLevel === "high") area.hazardLevel = "none";
        delete area.portal;
      }
      if (tier !== "A" && Array.isArray(area.npcs)) {
        for (const npc of area.npcs) {
          if (isObj(npc)) delete npc.reactions;
        }
      }
    }
    if (tier === "C" && spec.areas.length > 1) {
      const first = spec.areas[0];
      spec.areas = first ? [first] : [];
      if (isObj(first)) delete first.portal;
    }
  }
  if (tier !== "A") delete spec.bosses;
  const keptAreaId = Array.isArray(spec.areas) && isObj(spec.areas[0]) && typeof spec.areas[0].id === "string" ? spec.areas[0].id : undefined;
  if (Array.isArray(spec.missions)) {
    const next = [];
    for (const mission of spec.missions) {
      if (!isObj(mission)) continue;
      if (tier === "C" && mission.optional === true) continue;
      if (tier === "C" && keptAreaId && mission.areaId !== keptAreaId) continue;
      if (Array.isArray(mission.objectives)) {
        const objectives = [];
        for (const objective of mission.objectives) {
          if (!isObj(objective)) continue;
          if (objective.type === "defeat" && tier !== "A") continue;
          const challengeIds = objective.challengeIds;
          if (objective.type === "solve" && Array.isArray(challengeIds)) {
            const keptIds = challengeIds.filter((id) => typeof id === "string" && !removed.has(id));
            objective.challengeIds = keptIds;
            if (keptIds.length === 0) continue;
          }
          objectives.push(objective);
        }
        mission.objectives = objectives;
      }
      if (!Array.isArray(mission.objectives) || mission.objectives.length === 0) continue;
      next.push(mission);
    }
    const ids = new Set(next.map((mission) => (isObj(mission) ? mission.id : undefined)));
    for (const mission of next) {
      if (!isObj(mission)) continue;
      const requires = mission.requires;
      if (!Array.isArray(requires)) continue;
      const keptRequires = requires.filter((id) => typeof id === "string" && ids.has(id));
      mission.requires = keptRequires;
      if (keptRequires.length === 0) delete mission.requires;
    }
    spec.missions = next;
  }
  if (tier !== "A" && Array.isArray(spec.areas) && Array.isArray(spec.challenges)) {
    const placed = new Set<string>();
    for (const area of spec.areas) {
      if (!isObj(area) || !Array.isArray(area.stations)) continue;
      for (const station of area.stations) {
        if (isObj(station) && station.kind === "challenge" && typeof station.challengeId === "string") placed.add(station.challengeId);
      }
    }
    spec.challenges = spec.challenges.filter((challenge) => isObj(challenge) && typeof challenge.id === "string" && placed.has(challenge.id));
  }
  if (Array.isArray(spec.mechanics)) {
    const allowed = new Set(allowedMechanics(tier));
    spec.mechanics = spec.mechanics.filter((mechanic) => typeof mechanic === "string" && allowed.has(mechanic));
  }
  return { ok: true, spec };
}
