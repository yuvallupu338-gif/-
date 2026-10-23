import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { clampToTier, simulationIssues, traceProgram, validateGameSpec } from "./validate-game-spec";

const examplePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../skills/game-design/references/verified-example.json",
);

function fresh(): Record<string, unknown> {
  return JSON.parse(readFileSync(examplePath, "utf8")) as Record<string, unknown>;
}

function messages(spec: unknown, options?: Parameters<typeof validateGameSpec>[1]) {
  const report = validateGameSpec(spec, options);
  return {
    report,
    errors: report.errors.map((issue) => `${issue.path}: ${issue.message}`),
    warnings: report.warnings.map((issue) => `${issue.path}: ${issue.message}`),
  };
}

test("the verified fractions game passes with no errors and no warnings", () => {
  const checked = messages(fresh(), { tier: "A", mode: "FAST", device: "phone" });
  assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
  assert.deepEqual(checked.warnings, [], checked.warnings.join("\n"));
  assert.equal(checked.report.ok, true);
});

test("the same game passes when the tier is left to the document", () => {
  const checked = messages(fresh());
  assert.deepEqual(checked.errors, []);
  assert.deepEqual(checked.warnings, []);
});

test("clamping to tier B drops the boss and the reaction, and the game still passes", () => {
  const original = fresh();
  const blocked = messages(original, { tier: "B", mode: "FAST", device: "phone" });
  assert.equal(blocked.report.ok, false);
  assert.ok(blocked.errors.some((line) => line.includes("bosses are outside tier B")));
  assert.ok(blocked.errors.some((line) => line.includes("reactions are outside tier B")));

  const clamped = clampToTier(original, "B");
  assert.equal(clamped.ok, true);
  if (!clamped.ok) return;
  assert.equal("bosses" in (clamped.spec as object), false);
  const areas = (clamped.spec as { areas: Array<{ npcs: Array<Record<string, unknown>> }> }).areas;
  assert.equal(areas[0]?.npcs[0]?.reactions, undefined);
  const checked = messages(clamped.spec, { tier: "B", mode: "FAST", device: "phone" });
  assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
  assert.deepEqual(checked.warnings, [], checked.warnings.join("\n"));
  assert.ok((original as { bosses?: unknown }).bosses, "clamp does not mutate its input");
});

test("clamping to tier C also drops the match challenge and the side mission", () => {
  const clamped = clampToTier(fresh(), "C");
  assert.equal(clamped.ok, true);
  if (!clamped.ok) return;
  const spec = clamped.spec as {
    challenges: Array<{ id: string; type: string }>;
    missions: Array<{ id: string; optional?: boolean }>;
  };
  assert.deepEqual(
    spec.challenges.map((challenge) => challenge.type),
    ["choice", "numeric", "sequence"],
  );
  assert.equal(
    spec.missions.some((mission) => mission.optional),
    false,
  );
  const checked = messages(clamped.spec, { tier: "C", mode: "FAST", device: "phone" });
  assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
  assert.deepEqual(checked.warnings, [], checked.warnings.join("\n"));
});

test("a simulation game type fails the whole game at tier C", () => {
  const spec = fresh();
  (spec.meta as { gameType: string }).gameType = "simulation";
  const clamped = clampToTier(spec, "C");
  assert.equal(clamped.ok, false);
  if (clamped.ok) return;
  assert.match(clamped.errors[0]?.message ?? "", /outside tier C/);
});

test("duplicate choice text, a numeric giveaway, and a requires cycle are errors", () => {
  const same = fresh();
  const choice = (same.challenges as Array<Record<string, unknown>>)[0];
  (choice?.options as Array<{ text: string }>)[1]!.text = (choice?.options as Array<{ text: string }>)[0]!.text;
  assert.ok(messages(same).errors.some((line) => line.includes("has two options with the same text")));

  const numeric = fresh();
  const second = (numeric.challenges as Array<Record<string, unknown>>)[1];
  (second?.commonMistakes as Array<{ value: number }>)[0]!.value = 4;
  assert.ok(messages(numeric).errors.some((line) => line.includes("lists the correct answer 4 as a common mistake")));

  const cycle = fresh();
  (cycle.missions as Array<Record<string, unknown>>)[0]!.requires = ["m2"];
  assert.ok(messages(cycle).errors.some((line) => line.includes("requires form a cycle")));
});

test("the verified program solution reaches the goal in five blocks", () => {
  const solved = traceProgram({
    grid: {
      width: 4,
      height: 4,
      start: { x: 0, y: 0, dir: "E" },
      goal: { x: 3, y: 3 },
      walls: [{ x: 0, y: 1 }],
    },
    allowed: ["move", "turnRight", "repeat"],
    maxBlocks: 5,
    solution: [
      { t: "repeat", n: 3, body: [{ t: "move" }] },
      { t: "right" },
      { t: "repeat", n: 3, body: [{ t: "move" }] },
    ],
  });
  assert.deepEqual(solved, []);

  const tooBig = traceProgram({
    grid: {
      width: 4,
      height: 4,
      start: { x: 0, y: 0, dir: "E" },
      goal: { x: 3, y: 3 },
      walls: [{ x: 0, y: 1 }],
    },
    allowed: ["move", "turnRight", "repeat"],
    maxBlocks: 4,
    solution: [
      { t: "repeat", n: 3, body: [{ t: "move" }] },
      { t: "right" },
      { t: "repeat", n: 3, body: [{ t: "move" }] },
    ],
  });
  assert.ok(tooBig.some((line) => line.includes("too_many_blocks")));

  const stuck = traceProgram({
    grid: { width: 4, height: 4, start: { x: 0, y: 0, dir: "E" }, goal: { x: 3, y: 3 } },
    allowed: ["move"],
    maxBlocks: 2,
    solution: [{ t: "move" }],
  });
  assert.ok(stuck.some((line) => line.includes("not_at_goal")));
});

test("verified projectile and lever setups are solvable", () => {
  assert.deepEqual(simulationIssues({ kind: "projectile", gravity: 9.8, targetDistance: 40, tolerance: 2, maxSpeed: 30 }), []);
  assert.deepEqual(
    simulationIssues({ kind: "lever", leftWeight: 6, leftDistance: 2, rightWeight: 3, maxDistance: 10, tolerance: 0.25 }),
    [],
  );
  assert.ok(
    simulationIssues({ kind: "projectile", gravity: 25, targetDistance: 200, tolerance: 0.5, maxSpeed: 5 }).some((line) =>
      line.includes("target is out of reach"),
    ),
  );
  assert.ok(
    simulationIssues({ kind: "lever", leftWeight: 10, leftDistance: 10, rightWeight: 1, maxDistance: 5, tolerance: 0.25 }).some(
      (line) => line.includes("balance point is outside the lever"),
    ),
  );
});

function choice(id: string, level: number, objectiveId: string) {
  return {
    type: "choice",
    id,
    title: `חידה ${id}`,
    prompt: "בחרו את התשובה שמתאימה לכלל שלמדתם.",
    concept: "הכלל",
    objectiveId,
    level,
    hint: "חזרו אל הדוגמה שלמדתם, עם מספרים אחרים.",
    explanation: "התשובה הנכונה נובעת מהכלל שנלמד, והחלופה הראשונה מבלבלת בין שני מקרים קרובים אבל שונים.",
    options: [
      { id: "a", text: "המקרה הראשון", feedback: "זה המקרה השכן, לא המקרה שבשאלה." },
      { id: "b", text: "המקרה המתאים", feedback: "נכון, כי זה המקרה שהכלל מדבר עליו." },
      { id: "c", text: "המקרה ההפוך", feedback: "זה הכיוון השני של אותו כלל." },
    ],
    correctOptionId: "b",
  };
}

test("a door puzzle finishes in station order and deadlocks when a later room is required first", () => {
  const open = puzzle(["c1", "c2", "c3"]);
  const passed = messages(open, { tier: "A", mode: "FAST", device: "phone" });
  assert.deepEqual(passed.errors, [], passed.errors.join("\n"));
  assert.deepEqual(passed.warnings, [], passed.warnings.join("\n"));

  const stuck = puzzle(["c2", "c1", "c3"]);
  const failed = messages(stuck, { tier: "A", mode: "FAST", device: "phone" });
  assert.ok(failed.errors.some((line) => line.includes("cannot be finished")), failed.errors.join("\n"));
});

function puzzle(order: string[]) {
  const byId = Object.fromEntries(order.map((id, index) => [id, index]));
  return {
    meta: {
      title: "חדרי המנעול",
      tagline: "שלושה חדרים, מנעול אחד בכל דלת.",
      subject: "סדר",
      subjectCategory: "math",
      gameType: "puzzle",
      difficulty: "beginner",
      language: "he",
      estimatedMinutes: 6,
    },
    learning: {
      goal: "לסדר שלושה צעדים.",
      objectives: [{ id: "o1", text: "לבחור את הצעד הנכון בכל חדר." }],
      conclusion: "סדר נכון פותח את הדלת הבאה. בהמשך כדאי לתרגל שרשרת ארוכה יותר.",
    },
    theme: { environment: "castle", timeOfDay: "day" },
    mechanics: ["gates"],
    areas: [
      {
        id: "a1",
        name: "המסדרון",
        description: "שלושה חדרים זה אחרי זה.",
        layout: "rooms",
        size: "small",
        hazardLevel: "none",
        collectibles: { kind: "coin", count: 0, label: "מטבעות" },
        stations: [
          { id: "s1", kind: "challenge", label: "חדר ראשון", challengeId: "c1" },
          { id: "s2", kind: "challenge", label: "חדר שני", challengeId: "c2" },
          { id: "s3", kind: "challenge", label: "חדר שלישי", challengeId: "c3" },
        ],
      },
    ],
    missions: order.map((id, index) => ({
      id: `m${index + 1}`,
      title: `חדר ${index + 1}`,
      story: "הדלת מחכה לתשובה.",
      areaId: "a1",
      ...(index > 0 ? { requires: [`m${index}`] } : {}),
      objectives: [{ type: "solve", text: "פתרו את החידה", challengeIds: [id] }],
    })),
    challenges: ["c1", "c2", "c3"].map((id) => choice(id, [1, 2, 2][byId[id] ?? 0] ?? 1, "o1")),
  };
}

test("a two-area adventure with a boss is completable", () => {
  const checked = messages(adventure(), { tier: "A", mode: "FULL", device: "phone" });
  assert.deepEqual(checked.errors, [], checked.errors.join("\n"));
  assert.deepEqual(checked.warnings, [], checked.warnings.join("\n"));
});

function adventure() {
  const challenges = [
    choice("c1", 1, "o1"),
    choice("c2", 2, "o2"),
    choice("c3", 2, "o3"),
    choice("c4", 3, "o3"),
    choice("c5", 1, "o1"),
    choice("c6", 2, "o2"),
    choice("c7", 2, "o3"),
    choice("c8", 3, "o3"),
  ];
  const station = (id: string, challengeId: string) => ({ id, kind: "challenge", label: `תחנה ${id}`, challengeId });
  return {
    meta: {
      title: "שני אולמות",
      tagline: "לומדים באולם אחד ומוכיחים בשני.",
      subject: "כללים",
      subjectCategory: "math",
      gameType: "adventure",
      difficulty: "intermediate",
      language: "he",
      estimatedMinutes: 18,
    },
    learning: {
      goal: "ליישם כלל בשני הקשרים.",
      objectives: [
        { id: "o1", text: "לזהות את המקרה הבסיסי." },
        { id: "o2", text: "ליישם את הכלל על מקרה חדש." },
        { id: "o3", text: "לשלב שני רעיונות." },
      ],
      conclusion: "יישמתם את הכלל במקום חדש. בהמשך שווה לתרגל אותו מהכיוון השני.",
    },
    theme: { environment: "castle", timeOfDay: "dusk" },
    mechanics: ["collect", "dialogue", "portals"],
    areas: [
      {
        id: "a1",
        name: "האולם",
        description: "אולם פתוח עם שלט ומדריכה.",
        layout: "plaza",
        size: "medium",
        hazardLevel: "none",
        collectibles: { kind: "coin", count: 0, label: "מטבעות" },
        intro: "קודם קוראים, אחר כך עונים.",
        portal: { toAreaId: "a2", label: "אל החצר", requiresMissionIds: ["m3"] },
        stations: [
          {
            id: "s-lore",
            kind: "lore",
            label: "השלט",
            loreTitle: "הכלל",
            loreText: "כשמשווים שני מקרים, בודקים קודם מה נשאר קבוע ומה משתנה. בדוגמה של 2 ו־4, הכפלה ב־2 משנה את השני.",
          },
          station("s1", "c1"),
          station("s2", "c2"),
          station("s3", "c3"),
          station("s4", "c4"),
        ],
        npcs: [
          {
            id: "n1",
            name: "דנה",
            role: "מדריכה",
            look: { color: "#4488cc", shape: "human" },
            lines: ["קראו את השלט לפני החידות."],
            hint: "החזיקו את מה שנשאר קבוע.",
          },
        ],
      },
      {
        id: "a2",
        name: "החצר",
        description: "חצר שבה השומר שואל שוב.",
        layout: "plaza",
        size: "small",
        hazardLevel: "none",
        collectibles: { kind: "coin", count: 0, label: "מטבעות" },
        stations: [station("s5", "c5"), station("s6", "c6"), station("s7", "c7"), station("s8", "c8")],
        npcs: [
          {
            id: "n2",
            name: "אור",
            role: "שומר הסף",
            look: { color: "#cc8844", shape: "robot" },
            lines: ["כאן הכלל פוגש מקרה חדש."],
          },
        ],
      },
    ],
    missions: [
      {
        id: "m1",
        title: "פתיחה",
        story: "דנה מחכה ליד השלט.",
        areaId: "a1",
        objectives: [
          { type: "talk", text: "דברו עם דנה", npcId: "n1" },
          { type: "visit", text: "קראו את השלט", stationIds: ["s-lore"] },
        ],
      },
      {
        id: "m2",
        title: "תרגול",
        story: "שתי חידות על הכלל.",
        areaId: "a1",
        requires: ["m1"],
        objectives: [{ type: "solve", text: "פתרו שתי חידות", challengeIds: ["c1", "c2"] }],
      },
      {
        id: "m3",
        title: "יישום",
        story: "עוד שתי חידות, ואז השער.",
        areaId: "a1",
        requires: ["m2"],
        objectives: [{ type: "solve", text: "פתרו את שתי החידות הבאות", challengeIds: ["c3", "c4"] }],
      },
      {
        id: "m4",
        title: "חצר",
        story: "הכלל חוזר במקום חדש.",
        areaId: "a2",
        requires: ["m3"],
        objectives: [{ type: "solve", text: "פתרו את חידות החצר", challengeIds: ["c5", "c6"] }],
      },
      {
        id: "m5",
        title: "השומר",
        story: "השומר שואל את השאלות האחרונות.",
        areaId: "a2",
        requires: ["m4"],
        objectives: [
          { type: "solve", text: "פתרו את חידות השומר", challengeIds: ["c7", "c8"] },
          { type: "defeat", text: "נצחו את השומר", bossId: "b1" },
        ],
      },
    ],
    challenges,
    bosses: [
      {
        id: "b1",
        areaId: "a2",
        name: "השומר",
        title: "שומר הכלל",
        intro: "הציגו את הכלל בשתי שאלות.",
        defeatLine: "הכלל בידיכם. עברו!",
        look: { color: "#ff4d6d", shape: "creature" },
        phaseStationIds: ["s7", "s8"],
      },
    ],
  };
}
