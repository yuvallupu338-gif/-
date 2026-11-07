import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { toVisualRtl } from "../src/lib/bidi.ts";
import { buildWorkspace } from "../src/lib/consultant/compose.ts";
import { normalizeInput } from "../src/lib/consultant/shared.ts";
import { openDatabase } from "../src/lib/db.ts";
import { project, sumItems } from "../src/lib/finance.ts";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";
import { businessPlanPdf } from "../src/lib/pdf.ts";
import { insertWorkspace, getProject, updatePlanSection } from "../src/lib/repo.ts";
import { websiteFiles } from "../src/lib/website-html.ts";
import type { Assumptions, ProjectBundle } from "../src/lib/domain.ts";

test("break-even and cash are deterministic", () => {
  const assumptions: Assumptions = {
    startupItems: [{ id: "s", name: "setup", amount: 0, source: "input" }],
    monthlyItems: [{ id: "m", name: "fixed", amount: 200, source: "input" }],
    price: 100,
    cogsRatio: 0.5,
    startingCustomers: 10,
    monthlyGrowth: 0,
    horizon: 2,
    openingCash: 1000,
    openingCashSource: "input",
    notes: "",
  };
  const result = project(assumptions);
  assert.equal(result.contributionPerCustomer, 50);
  assert.equal(result.breakEvenCustomers, 4);
  assert.equal(result.breakEvenMonth, 1);
  assert.equal(result.rows[0]?.revenue, 1000);
  assert.equal(result.rows[0]?.operatingProfit, 300);
  assert.equal(result.rows[0]?.cumulativeCash, 1300);
  assert.equal(result.rows[1]?.cumulativeCash, 1600);
});

test("negative contribution has no break-even", () => {
  const result = project({
    startupItems: [],
    monthlyItems: [{ id: "m", name: "rent", amount: 100, source: "estimate" }],
    price: 0,
    cogsRatio: 0.2,
    startingCustomers: 5,
    monthlyGrowth: 0.1,
    horizon: 3,
    openingCash: 50,
    openingCashSource: "estimate",
    notes: "",
  });
  assert.equal(result.breakEvenCustomers, null);
  assert.equal(result.breakEvenMonth, null);
});

test("hebrew visual order keeps numbers intact", () => {
  const visual = toVisualRtl("תקציב 40000 ₪");
  assert.ok(visual.endsWith("ביצקת"));
  assert.equal(visual.includes("40000"), true);
  assert.ok(visual.indexOf("40000") < visual.lastIndexOf("ביצקת"));
});

test("fitness apparel idea becomes a labeled preliminary workspace", () => {
  const profile = normalizeInput({
    idea: "I want to launch a premium fitness clothing brand in Israel with a starting budget of 40000 shekels.",
    industryKey: "apparel",
    location: "תל אביב",
    currency: "ILS",
    budget: 40000,
    audience: "צעירים שמתאמנים אחרי העבודה",
    experience: "first",
    businessType: "product",
    goals: "מכירה ראשונה ל-30 לקוחות",
    locale: "he",
  });
  assert.equal(profile.industryKey, "apparel");
  assert.equal(profile.pricingTier, "premium");
  assert.equal(profile.isIsrael, true);
  assert.equal(profile.industryLabel, "ביגוד כושר");
  const workspace = buildWorkspace(profile);
  assert.equal(workspace.analysis.mode, "preliminary");
  assert.match(workspace.analysis.disclaimer, /ראשוני/);
  assert.match(workspace.analysis.opportunity, /40000/);
  assert.match(workspace.analysis.opportunity, /תל אביב/);
  assert.equal(workspace.plan.length, 11);
  assert.equal(sumItems(workspace.scenarios.find((item) => item.key === "base")!.assumptions.startupItems), 40000);
  assert.equal(workspace.calendar.length, 30);
  const phases = new Set(workspace.tasks.map((task) => task.phase));
  assert.equal(phases.size, 8);
  assert.match(workspace.website.sections.find((section) => section.type === "hero")?.content.title ?? "", /.+/);
  assert.doesNotMatch(JSON.stringify(workspace.analysis), /מיליארד|רווח מובטח|market share/i);
});

test("an amount written in the idea is used when the budget field is empty", () => {
  const profile = normalizeInput({
    idea: "אני רוצה להשיק מותג ביגוד כושר פרימיום בישראל עם תקציב התחלתי של 40,000 שקלים.",
    industryKey: "general",
    location: "תל אביב",
    currency: "ILS",
    budget: null,
    audience: "אנשים שמתאמנים אחרי העבודה",
    experience: "first",
    businessType: "product",
    goals: "30 הזמנות ראשונות בתוך 90 יום",
    locale: "he",
  });
  assert.equal(profile.industryKey, "apparel");
  assert.equal(profile.industryLabel, "ביגוד כושר");
  assert.equal(profile.budget, 40000);
  assert.equal(profile.budgetProvided, false);
  assert.equal(profile.budgetSource, "mentioned");
  const workspace = buildWorkspace(profile);
  assert.match(workspace.analysis.opportunity, /נקרא מתיאור/);
  assert.equal(sumItems(workspace.scenarios.find((item) => item.key === "base")!.assumptions.startupItems), 40000);
  assert.equal(workspace.scenarios[0]?.assumptions.openingCashSource, "estimate");
  const entered = normalizeInput({ ...profile, industryKey: "apparel", budget: 15000, idea: profile.idea });
  assert.equal(entered.budget, 15000);
  assert.equal(entered.budgetSource, "entered");
  const plain = normalizeInput({ ...profile, industryKey: "general", budget: null, idea: "סטודיו ייעוץ קטן בלי סכום" });
  assert.equal(plain.budget, 20000);
  assert.equal(plain.budgetSource, "default");
});

test("website export escapes script content", () => {
  const profile = normalizeInput({
    idea: "סטודיו קפה שכונתי עם תקציב קטן",
    industryKey: "food",
    location: "חיפה",
    currency: "ILS",
    budget: 15000,
    audience: "",
    experience: "some",
    businessType: "retail",
    goals: "",
    locale: "he",
  });
  const workspace = buildWorkspace(profile);
  workspace.website.sections[1]!.content.title = `<script>alert("x")</script>`;
  const bundle = {
    id: "p",
    userId: "u",
    name: "קפה",
    idea: profile.idea,
    profile,
    generationMode: "preliminary",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysis: workspace.analysis,
    plan: [],
    brands: workspace.brands,
    selectedBrandId: null,
    website: workspace.website,
    scenarios: [],
    marketing: [],
    calendar: [],
    tasks: [],
    shareToken: null,
    shareRevoked: true,
  } as ProjectBundle;
  const files = websiteFiles(bundle);
  assert.equal(files["index.html"].includes("<script>alert"), false);
  assert.match(files["index.html"], /&lt;script&gt;/);
});

test("project data survives a reopened database", () => {
  const file = path.join(os.tmpdir(), `launchlab-${Date.now()}.db`);
  const db = openDatabase(file);
  const profile = normalizeInput({
    idea: "מותג ביגוד כושר פרימיום בישראל",
    industryKey: "apparel",
    location: "ישראל",
    currency: "ILS",
    budget: 40000,
    audience: "מתאמנים",
    experience: "first",
    businessType: "product",
    goals: "השקה שקטה",
    locale: "he",
  });
  const workspace = buildWorkspace(profile);
  const userId = "user-1";
  db.prepare("INSERT INTO users (id, name, email, password_hash, locale, theme, created_at) VALUES (?, ?, ?, ?, 'he', 'light', ?)").run(
    userId,
    "דנה",
    "dana@example.com",
    hashPassword("correct-horse"),
    new Date().toISOString(),
  );
  const projectId = insertWorkspace(db, userId, profile, workspace, "preliminary");
  updatePlanSection(db, userId, projectId, "executive", { content: "טקסט שנערך ביד", origin: "user" });
  db.close();
  const reopened = openDatabase(file);
  const loaded = getProject(reopened, userId, projectId);
  assert.ok(loaded);
  assert.equal(loaded?.plan.find((section) => section.key === "executive")?.content, "טקסט שנערך ביד");
  assert.equal(getProject(reopened, "someone-else", projectId), null);
  const user = reopened.prepare("SELECT password_hash FROM users WHERE email = ?").get("dana@example.com") as { password_hash: string };
  assert.equal(verifyPassword("correct-horse", user.password_hash), true);
  assert.equal(verifyPassword("wrong-password", user.password_hash), false);
  reopened.close();
  fs.rmSync(file, { force: true });
  for (const suffix of ["-wal", "-shm"]) fs.rmSync(file + suffix, { force: true });
});

test("business plan pdf is a real file", async () => {
  const profile = normalizeInput({
    idea: "מותג ביגוד כושר פרימיום בישראל בתקציב 40000",
    industryKey: "apparel",
    location: "תל אביב",
    currency: "ILS",
    budget: 40000,
    audience: "מתאמנים",
    experience: "first",
    businessType: "product",
    goals: "",
    locale: "he",
  });
  const workspace = buildWorkspace(profile);
  const bundle = {
    id: "p",
    userId: "u",
    name: profile.displayName,
    idea: profile.idea,
    profile,
    generationMode: "preliminary" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analysis: workspace.analysis,
    plan: workspace.plan.map((section, index) => ({ ...section, id: String(index), locked: false, origin: "preliminary" as const, position: index, updatedAt: new Date().toISOString() })),
    brands: workspace.brands,
    selectedBrandId: null,
    website: workspace.website,
    scenarios: workspace.scenarios.map((scenario) => ({ ...scenario, id: scenario.key, updatedAt: new Date().toISOString() })),
    marketing: [],
    calendar: [],
    tasks: [],
    shareToken: null,
    shareRevoked: true,
  } satisfies ProjectBundle;
  const bytes = await businessPlanPdf(bundle);
  assert.equal(Buffer.from(bytes).subarray(0, 4).toString(), "%PDF");
  assert.ok(bytes.length > 1000);
});
