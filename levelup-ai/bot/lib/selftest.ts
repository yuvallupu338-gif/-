import { normalizeRequestCard } from "./request-card.js";
import { FOREST_FRACTIONS_SPEC, VERIFIED_PROGRAM } from "./fixtures.js";
import { allowedOk, parseGrid, parseSolution, traceProgram } from "./program.js";
import { validateGameSpec } from "./validate-game-spec.js";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const forest = validateGameSpec(FOREST_FRACTIONS_SPEC, {
  mode: "FAST",
  level: "A",
  device: "phone",
});
assert(forest.ok, `forest example failed: ${JSON.stringify(forest.issues, null, 2)}`);
assert(forest.errorCount === 0 && forest.warningCount === 0, `forest warnings: ${JSON.stringify(forest.issues)}`);

const broken = structuredClone(FOREST_FRACTIONS_SPEC) as Record<string, unknown>;
const challenges = broken.challenges as Array<Record<string, unknown>>;
challenges[0] = { ...challenges[0], correctOptionId: "missing" };
const bad = validateGameSpec(broken, { mode: "FAST", level: "A", device: "phone" });
assert(!bad.ok, "broken correctOptionId should fail");
assert(
  bad.issues.some((i) => i.message.includes("must name one of the options")),
  "expected correctOptionId error",
);

const grid = parseGrid(VERIFIED_PROGRAM.grid);
const allowed = allowedOk(VERIFIED_PROGRAM.allowed);
const solution = parseSolution(VERIFIED_PROGRAM.solution);
assert(typeof grid !== "string" && typeof allowed !== "string" && typeof solution !== "string", "program parse");
assert(traceProgram(grid, allowed, VERIFIED_PROGRAM.maxBlocks, solution) === undefined, "verified program must solve");

const card = normalizeRequestCard({
  subject: "שברים",
  learningGoal: "After playing, learners can compare unit fractions.",
});
assert(card.mode === "FAST" && card.level === "A" && card.device === "phone", "defaults");
assert(card.gameType === "exploration", "FAST default game type");

const simAtB = normalizeRequestCard({ gameType: "simulation", level: "B", mode: "FAST" });
assert(simAtB.gameType !== "simulation", "tier clamp should drop simulation at B");
assert(simAtB.adjustments.length > 0, "tier clamp is recorded");

console.log("selftest ok", forest.summary, "max", forest.scoreEstimate?.maximum);
