import { PROGRAM_ALLOWED, PROGRAM_SOLUTION_KINDS } from "./types.js";

export type ProgramBlock =
  | { t: "move" }
  | { t: "left" }
  | { t: "right" }
  | { t: "repeat"; n: number; body: ProgramBlock[] }
  | { t: "if"; body: ProgramBlock[]; else?: ProgramBlock[] };

export type ProgramGrid = {
  width: number;
  height: number;
  start: { x: number; y: number; dir: "N" | "E" | "S" | "W" };
  goal: { x: number; y: number };
  walls?: { x: number; y: number }[];
};

const DELTA: Record<string, [number, number]> = {
  N: [0, -1],
  E: [1, 0],
  S: [0, 1],
  W: [-1, 0],
};
const LEFT: Record<string, "N" | "E" | "S" | "W"> = { N: "W", W: "S", S: "E", E: "N" };
const RIGHT: Record<string, "N" | "E" | "S" | "W"> = { N: "E", E: "S", S: "W", W: "N" };

export function countBlocks(blocks: ProgramBlock[]): number {
  let n = 0;
  for (const b of blocks) {
    n += 1;
    if (b.t === "repeat") n += countBlocks(b.body);
    if (b.t === "if") n += countBlocks(b.body) + countBlocks(b.else ?? []);
  }
  return n;
}

export function nestDepth(blocks: ProgramBlock[], depth = 0): number {
  let max = depth;
  for (const b of blocks) {
    if (b.t === "repeat" || b.t === "if") {
      max = Math.max(max, nestDepth(b.body, depth + 1));
      if (b.t === "if") max = Math.max(max, nestDepth(b.else ?? [], depth + 1));
    }
  }
  return max;
}

function parseBlock(raw: unknown): ProgramBlock | string {
  if (!raw || typeof raw !== "object") return "block is not an object";
  const o = raw as Record<string, unknown>;
  const t = o.t;
  if (typeof t !== "string") return "block missing t";
  if (!(PROGRAM_SOLUTION_KINDS as readonly string[]).includes(t)) {
    return `solution block "${t}" is not move|left|right|repeat|if`;
  }
  if (t === "move" || t === "left" || t === "right") return { t };
  if (t === "repeat") {
    if (typeof o.n !== "number" || !Number.isInteger(o.n) || o.n < 2 || o.n > 9) {
      return "repeat.n must be an integer 2–9";
    }
    if (!Array.isArray(o.body) || o.body.length < 1 || o.body.length > 8) {
      return "repeat.body must have 1–8 blocks";
    }
    const body: ProgramBlock[] = [];
    for (const item of o.body) {
      const parsed = parseBlock(item);
      if (typeof parsed === "string") return parsed;
      body.push(parsed);
    }
    return { t: "repeat", n: o.n, body };
  }
  if (!Array.isArray(o.body) || o.body.length > 8) return "if.body must have 0–8 blocks";
  const body: ProgramBlock[] = [];
  for (const item of o.body) {
    const parsed = parseBlock(item);
    if (typeof parsed === "string") return parsed;
    body.push(parsed);
  }
  const elseBody: ProgramBlock[] = [];
  if (o.else !== undefined) {
    if (!Array.isArray(o.else) || o.else.length > 8) return "if.else must have 0–8 blocks";
    for (const item of o.else) {
      const parsed = parseBlock(item);
      if (typeof parsed === "string") return parsed;
      elseBody.push(parsed);
    }
  }
  return { t: "if", body, else: elseBody };
}

export function parseSolution(raw: unknown): ProgramBlock[] | string {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 14) {
    return "solution must be 1–14 blocks";
  }
  const out: ProgramBlock[] = [];
  for (const item of raw) {
    const parsed = parseBlock(item);
    if (typeof parsed === "string") return parsed;
    out.push(parsed);
  }
  return out;
}

export function allowedOk(allowed: unknown): string | string[] {
  if (!Array.isArray(allowed) || allowed.length < 1 || allowed.length > 5) {
    return "allowed must list 1–5 of move|turnLeft|turnRight|repeat|ifPathClear";
  }
  const seen = new Set<string>();
  for (const item of allowed) {
    if (typeof item !== "string" || !(PROGRAM_ALLOWED as readonly string[]).includes(item)) {
      return `allowed lists unknown block "${String(item)}"`;
    }
    if (seen.has(item)) return `allowed repeats "${item}"`;
    seen.add(item);
  }
  return allowed as string[];
}

function solutionUses(blocks: ProgramBlock[], allowed: Set<string>): string | undefined {
  for (const b of blocks) {
    if (b.t === "move" && !allowed.has("move")) return "solution uses move, which is not in allowed";
    if (b.t === "left" && !allowed.has("turnLeft")) return "solution uses left, which needs turnLeft in allowed";
    if (b.t === "right" && !allowed.has("turnRight")) return "solution uses right, which needs turnRight in allowed";
    if (b.t === "repeat") {
      if (!allowed.has("repeat")) return "solution uses repeat, which is not in allowed";
      const inner = solutionUses(b.body, allowed);
      if (inner) return inner;
    }
    if (b.t === "if") {
      if (!allowed.has("ifPathClear")) return "solution uses if, which needs ifPathClear in allowed";
      const inner = solutionUses(b.body, allowed) ?? solutionUses(b.else ?? [], allowed);
      if (inner) return inner;
    }
  }
  return undefined;
}

export function traceProgram(
  grid: ProgramGrid,
  allowed: string[],
  maxBlocks: number,
  solution: ProgramBlock[],
): string | undefined {
  const walls = new Set((grid.walls ?? []).map((w) => `${w.x},${w.y}`));
  const inBounds = (x: number, y: number) => x >= 0 && y >= 0 && x < grid.width && y < grid.height;
  if (!inBounds(grid.start.x, grid.start.y) || !inBounds(grid.goal.x, grid.goal.y)) {
    return "start or goal is outside the grid";
  }
  if (walls.has(`${grid.start.x},${grid.start.y}`) || walls.has(`${grid.goal.x},${grid.goal.y}`)) {
    return "start or goal sits on a wall";
  }
  if (grid.start.x === grid.goal.x && grid.start.y === grid.goal.y) {
    return "start and goal are the same cell";
  }
  const used = countBlocks(solution);
  if (used > maxBlocks) return `solution uses ${used} blocks, over maxBlocks ${maxBlocks}`;
  if (nestDepth(solution) > 3) return "solution nests deeper than 3";
  const allowErr = solutionUses(solution, new Set(allowed));
  if (allowErr) return allowErr;

  let x = grid.start.x;
  let y = grid.start.y;
  let dir: "N" | "E" | "S" | "W" = grid.start.dir;
  let actions = 0;

  const aheadFree = () => {
    const [dx, dy] = DELTA[dir];
    const nx = x + dx;
    const ny = y + dy;
    return inBounds(nx, ny) && !walls.has(`${nx},${ny}`);
  };

  const run = (blocks: ProgramBlock[]): string | undefined => {
    for (const b of blocks) {
      if (actions >= 400) return "step_limit";
      if (b.t === "move") {
        actions += 1;
        if (aheadFree()) {
          const [dx, dy] = DELTA[dir];
          x += dx;
          y += dy;
        }
      } else if (b.t === "left") {
        actions += 1;
        dir = LEFT[dir];
      } else if (b.t === "right") {
        actions += 1;
        dir = RIGHT[dir];
      } else if (b.t === "repeat") {
        actions += 1;
        for (let i = 0; i < b.n; i += 1) {
          const err = run(b.body);
          if (err) return err;
        }
      } else {
        actions += 1;
        const err = run(aheadFree() ? b.body : (b.else ?? []));
        if (err) return err;
      }
    }
    return undefined;
  };

  const err = run(solution);
  if (err) return err;
  if (x !== grid.goal.x || y !== grid.goal.y) return "not_at_goal";
  return undefined;
}

export function parseGrid(raw: unknown): ProgramGrid | string {
  if (!raw || typeof raw !== "object") return "grid must be an object";
  const g = raw as Record<string, unknown>;
  if (!Number.isInteger(g.width) || (g.width as number) < 3 || (g.width as number) > 7) {
    return "grid.width must be 3–7";
  }
  if (!Number.isInteger(g.height) || (g.height as number) < 3 || (g.height as number) > 7) {
    return "grid.height must be 3–7";
  }
  const start = g.start as Record<string, unknown> | undefined;
  const goal = g.goal as Record<string, unknown> | undefined;
  if (!start || !goal) return "grid needs start and goal";
  if (!Number.isInteger(start.x) || !Number.isInteger(start.y) || typeof start.dir !== "string") {
    return "grid.start needs x, y, dir";
  }
  if (!["N", "E", "S", "W"].includes(start.dir)) return "grid.start.dir must be N|E|S|W";
  if (!Number.isInteger(goal.x) || !Number.isInteger(goal.y)) return "grid.goal needs x, y";
  const walls: { x: number; y: number }[] = [];
  if (g.walls !== undefined) {
    if (!Array.isArray(g.walls) || g.walls.length > 24) return "grid.walls must have 0–24 cells";
    for (const w of g.walls) {
      if (!w || typeof w !== "object") return "wall must be {x,y}";
      const cell = w as Record<string, unknown>;
      if (!Number.isInteger(cell.x) || !Number.isInteger(cell.y)) return "wall needs integer x,y";
      walls.push({ x: cell.x as number, y: cell.y as number });
    }
  }
  return {
    width: g.width as number,
    height: g.height as number,
    start: { x: start.x as number, y: start.y as number, dir: start.dir as "N" | "E" | "S" | "W" },
    goal: { x: goal.x as number, y: goal.y as number },
    walls,
  };
}
