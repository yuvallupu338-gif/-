"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { BUSINESS_TYPES, CURRENCIES, EXPERIENCE_LEVELS, INDUSTRIES, PHASES, type BrandDirection, type BusinessProfile, type CalendarItem, type RoadTask, type WebsiteDoc } from "@/lib/domain";
import { generateModeledSection, generateModeledWorkspace, integrationStatus, modelDailyLimit, preliminarySection } from "@/lib/ai";
import { buildWorkspace, extraNames, rebuildAnalysis, websiteFromBrand } from "@/lib/consultant/compose";
import { normalizeInput, text } from "@/lib/consultant/shared";
import { getDb } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sanitizeAssumptions } from "@/lib/finance";
import {
  addTask,
  createSession,
  createShare,
  createUser,
  deleteProject,
  deleteSession,
  deleteTask,
  findUserByEmail,
  getProject,
  insertWorkspace,
  listSnapshots,
  logGeneration,
  markNotificationRead,
  notify,
  revokeShare,
  saveTask,
  selectBrand,
  takeRateSlot,
  updateAnalysis,
  updateBrand,
  updateCalendar,
  updateMarketing,
  updatePlanSection,
  updateProfile,
  updateScenario,
  updateUserPrefs,
  updateWebsite,
} from "@/lib/repo";
import { SESSION_COOKIE, currentUser, requireUser, safeNext, sessionCookieOptions, uiLocale } from "@/server/session";
import { cookies } from "next/headers";

export type ActionResult = { ok: true } | { ok: false; error: string };

function fail(locale: "he" | "en", he: string, en: string): ActionResult {
  return { ok: false, error: text(locale, he, en) };
}

async function actor() {
  const user = await requireUser();
  const locale = await uiLocale();
  return { user, locale, db: getDb() };
}

export async function registerAction(formData: FormData) {
  const locale = await uiLocale();
  const parsed = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(160),
    password: z.string().min(8).max(200),
    next: z.string().optional(),
  }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return fail(locale, "בדקו שם, אימייל וסיסמה של 8 תווים לפחות.", "Check the name, email, and a password of at least 8 characters.");
  const email = parsed.data.email.toLowerCase();
  const db = getDb();
  if (findUserByEmail(db, email)) return fail(locale, "כבר יש חשבון עם האימייל הזה.", "An account with this email already exists.");
  const user = createUser(db, { name: parsed.data.name, email, passwordHash: hashPassword(parsed.data.password), locale });
  const session = createSession(db, user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, sessionCookieOptions());
  jar.set("ll_locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  redirect(safeNext(parsed.data.next));
}

export async function loginAction(formData: FormData) {
  const locale = await uiLocale();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const db = getDb();
  const user = findUserByEmail(db, email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return fail(locale, "האימייל או הסיסמה לא תואמים.", "The email or password does not match.");
  }
  const session = createSession(db, user.id);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, sessionCookieOptions());
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function logoutAction() {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) deleteSession(getDb(), sessionId);
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function setPreferenceAction(kind: "locale" | "theme", value: string) {
  const jar = await cookies();
  if (kind === "locale" && (value === "he" || value === "en")) {
    jar.set("ll_locale", value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    const user = await currentUser();
    if (user) updateUserPrefs(getDb(), user.id, { locale: value });
  }
  if (kind === "theme" && (value === "light" || value === "dark")) {
    jar.set("ll_theme", value, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    const user = await currentUser();
    if (user) updateUserPrefs(getDb(), user.id, { theme: value });
  }
}

const createSchema = z.object({
  idea: z.string().trim().min(10).max(4000),
  industryKey: z.enum(INDUSTRIES),
  location: z.string().trim().max(80).optional().default(""),
  currency: z.enum(CURRENCIES),
  budget: z.string().optional().default(""),
  audience: z.string().trim().max(240).optional().default(""),
  experience: z.enum(EXPERIENCE_LEVELS),
  businessType: z.enum(BUSINESS_TYPES),
  goals: z.string().trim().max(600).optional().default(""),
  mode: z.enum(["preliminary", "model"]),
});

export async function createProjectAction(formData: FormData): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const parsed = createSchema.safeParse({
    idea: formData.get("idea"),
    industryKey: formData.get("industryKey"),
    location: formData.get("location") ?? "",
    currency: formData.get("currency"),
    budget: formData.get("budget") ?? "",
    audience: formData.get("audience") ?? "",
    experience: formData.get("experience"),
    businessType: formData.get("businessType"),
    goals: formData.get("goals") ?? "",
    mode: formData.get("mode"),
  });
  if (!parsed.success) return fail(locale, "חסר רעיון ברור, או שאחד השדות לא תקין.", "A clear idea is missing, or one of the fields is invalid.");
  const budgetText = parsed.data.budget.trim();
  const budget = budgetText === "" ? null : Number(budgetText);
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return fail(locale, "התקציב צריך להיות מספר חיובי או להישאר ריק.", "Budget must be a positive number, or stay empty.");
  const profile = normalizeInput({ ...parsed.data, budget, locale });
  const status = integrationStatus();
  if (parsed.data.mode === "model" && !status.configured) {
    return fail(locale, "אין מודל שפה מוגדר. אפשר ליצור ניתוח ראשוני, והוא יסומן ככזה.", "No language model is configured. You can create a preliminary analysis, and it will be labeled as such.");
  }
  const limit = parsed.data.mode === "model" ? modelDailyLimit() : 80;
  if (!takeRateSlot(db, user.id, limit)) return fail(locale, "הגעתם למכסת היצירה היומית.", "You reached today’s generation limit.");
  try {
    const workspace = parsed.data.mode === "model" ? await generateModeledWorkspace(profile) : buildWorkspace(profile);
    const id = insertWorkspace(db, user.id, profile, workspace, parsed.data.mode);
    redirect(`/app/projects/${id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw error;
    logGeneration(db, { userId: user.id, kind: "workspace", status: "error", mode: parsed.data.mode, message: error instanceof Error ? error.message : "failed" });
    return fail(locale, "היצירה לא הושלמה. שום פרויקט לא נשמר.", "Generation did not finish. No project was saved.");
  }
}

export async function saveProfileAction(projectId: string, input: { name: string; location: string; audience: string; goals: string; budget: number; currency: "ILS" | "USD" | "EUR"; pricingTier: "value" | "mid" | "premium" | "luxury" }): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) return fail(locale, "צריך שם לפרויקט.", "The project needs a name.");
  const profile: BusinessProfile = {
    ...bundle.profile,
    displayName: name,
    location: input.location.trim().slice(0, 80),
    audience: input.audience.trim().slice(0, 240),
    goals: input.goals.trim().slice(0, 600),
    budget: Math.max(0, input.budget || 0),
    budgetProvided: true,
    budgetSource: "entered",
    currency: input.currency,
    pricingTier: input.pricingTier,
    idea: bundle.profile.idea,
  };
  updateProfile(db, user.id, projectId, profile, name);
  return { ok: true };
}

export async function saveAnalysisAction(projectId: string, analysis: ProjectAnalysis): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const saved = updateAnalysis(db, user.id, projectId, { ...analysis, mode: bundle.analysis.mode, disclaimer: bundle.analysis.disclaimer });
  return saved ? { ok: true } : fail(locale, "לא ניתן לשמור.", "Could not save.");
}

type ProjectAnalysis = import("@/lib/domain").Analysis;

export async function saveSectionAction(projectId: string, key: string, content: string, title: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const ok = updatePlanSection(db, user.id, projectId, key, { content: content.slice(0, 20000), title: title.slice(0, 80), origin: "user" });
  return ok ? { ok: true } : fail(locale, "הסעיף לא נשמר.", "The section was not saved.");
}

export async function setSectionLockAction(projectId: string, key: string, locked: boolean): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const ok = updatePlanSection(db, user.id, projectId, key, { locked });
  return ok ? { ok: true } : fail(locale, "לא ניתן לעדכן את הנעילה.", "Could not update the lock.");
}

export async function regenerateSectionAction(projectId: string, key: import("@/lib/domain").PlanKey, mode: "preliminary" | "model"): Promise<ActionResult & { content?: string; title?: string }> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const section = bundle.plan.find((item) => item.key === key);
  if (!section) return fail(locale, "הסעיף לא נמצא.", "The section was not found.");
  if (section.locked) return fail(locale, "הסעיף נעול כדי לשמור את העריכה. בטלו את הנעילה לפני רענון.", "The section is locked to protect your edit. Unlock it before refreshing.");
  if (mode === "model" && !integrationStatus().configured) return fail(locale, "אין מודל שפה מוגדר. הרענון לא רץ, והטקסט נשאר כמו שהוא.", "No language model is configured. Nothing ran, and the text stayed as it is.");
  const limit = mode === "model" ? modelDailyLimit() : 80;
  if (!takeRateSlot(db, user.id, limit)) return fail(locale, "הגעתם למכסת היצירה היומית.", "You reached today’s generation limit.");
  try {
    const brand = bundle.brands.find((item) => item.id === bundle.selectedBrandId) ?? bundle.brands[0];
    const next = mode === "model"
      ? await generateModeledSection(bundle.profile, key, `${brand?.chosenName ?? ""} ${brand?.positioning ?? ""}`)
      : preliminarySection({ ...bundle.profile, locale }, key);
    updatePlanSection(db, user.id, projectId, key, { ...next, origin: mode === "model" ? "model" : "preliminary" });
    logGeneration(db, { userId: user.id, projectId, kind: `plan:${key}`, status: "ok", mode });
    return { ok: true, content: next.content, title: next.title };
  } catch (error) {
    logGeneration(db, { userId: user.id, projectId, kind: `plan:${key}`, status: "error", mode, message: error instanceof Error ? error.message : "failed" });
    return fail(locale, "הרענון נכשל. הסעיף הקודם נשאר ללא שינוי.", "The refresh failed. The previous section was left unchanged.");
  }
}

export async function refreshAnalysisAction(projectId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  if (bundle.analysis.mode === "model") return fail(locale, "הניתוח הזה סומן כנוצר במודל. רענון ראשוני לא יחליף אותו אוטומטית.", "This analysis is marked as model-created. A preliminary refresh will not replace it automatically.");
  if (!takeRateSlot(db, user.id, 80)) return fail(locale, "הגעתם למכסת היצירה היומית.", "You reached today’s generation limit.");
  const next = rebuildAnalysis({ ...bundle.profile, locale });
  updateAnalysis(db, user.id, projectId, next);
  return { ok: true };
}

export async function saveBrandAction(projectId: string, brand: BrandDirection): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const cleaned = { ...brand, chosenName: brand.chosenName.slice(0, 60), tagline: brand.tagline.slice(0, 160), positioning: brand.positioning.slice(0, 2000) };
  const ok = updateBrand(db, user.id, projectId, cleaned);
  return ok ? { ok: true } : fail(locale, "כיוון המותג לא נשמר.", "The brand direction was not saved.");
}

export async function selectBrandAction(projectId: string, brandId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const brand = bundle.brands.find((item) => item.id === brandId);
  if (!brand || !selectBrand(db, user.id, projectId, brandId)) return fail(locale, "הכיוון לא נמצא.", "The direction was not found.");
  if (!bundle.website.touched && bundle.website.basedOnBrandId !== brand.id) {
    updateWebsite(db, user.id, projectId, websiteFromBrand(bundle.profile, brand));
  }
  notify(db, {
    userId: user.id,
    projectId,
    title: text(locale, "נבחר כיוון מותג", "Brand direction selected"),
    body: brand.chosenName,
    href: `/app/projects/${projectId}/brand`,
  });
  return { ok: true };
}

export async function moreNamesAction(projectId: string, brandId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  const brand = bundle?.brands.find((item) => item.id === brandId);
  if (!bundle || !brand) return fail(locale, "הכיוון לא נמצא.", "The direction was not found.");
  const additions = extraNames(bundle.profile, brand.names.length + 1).filter((item) => !brand.names.some((existing) => existing.name === item.name));
  return updateBrand(db, user.id, projectId, { ...brand, names: [...brand.names, ...additions].slice(0, 12) })
    ? { ok: true }
    : fail(locale, "לא נוספו שמות.", "No names were added.");
}

export async function applyBrandToSiteAction(projectId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const brand = bundle.brands.find((item) => item.id === bundle.selectedBrandId) ?? bundle.brands[0];
  if (!brand) return fail(locale, "אין כיוון מותג.", "There is no brand direction.");
  updateWebsite(db, user.id, projectId, websiteFromBrand(bundle.profile, brand));
  return { ok: true };
}

export async function saveWebsiteAction(projectId: string, website: WebsiteDoc): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const ok = updateWebsite(db, user.id, projectId, { ...website, touched: true });
  return ok ? { ok: true } : fail(locale, "האתר לא נשמר.", "The website was not saved.");
}

export async function saveScenarioAction(projectId: string, key: "conservative" | "base" | "optimistic", assumptions: import("@/lib/domain").Assumptions): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const scenario = bundle.scenarios.find((item) => item.key === key);
  if (!scenario) return fail(locale, "התרחיש לא נמצא.", "The scenario was not found.");
  updateScenario(db, user.id, projectId, key, scenario.name, sanitizeAssumptions(assumptions));
  updateProfile(db, user.id, projectId, { ...bundle.profile, financeReviewed: true }, bundle.name);
  return { ok: true };
}

export async function saveMarketingAction(projectId: string, assets: { id: string; title: string; content: string }[], calendar: CalendarItem[]): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const nextAssets = bundle.marketing.map((asset) => {
    const edited = assets.find((item) => item.id === asset.id);
    return edited ? { ...asset, title: edited.title.slice(0, 120), content: edited.content.slice(0, 8000) } : asset;
  });
  updateMarketing(db, user.id, projectId, nextAssets);
  updateCalendar(db, user.id, projectId, calendar.map((item) => ({ ...item, concept: item.concept.slice(0, 160), caption: item.caption.slice(0, 500), channel: item.channel.slice(0, 40) })));
  updateProfile(db, user.id, projectId, { ...bundle.profile, marketingReviewed: true }, bundle.name);
  return { ok: true };
}

export async function saveTaskAction(projectId: string, task: RoadTask): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  if (task.done && task.dependsOn) {
    const dependency = bundle.tasks.find((item) => item.id === task.dependsOn);
    if (dependency && !dependency.done) return fail(locale, `קודם צריך להשלים: ${dependency.title}`, `Finish this first: ${dependency.title}`);
  }
  const ok = saveTask(db, user.id, projectId, { ...task, title: task.title.slice(0, 160), notes: task.notes.slice(0, 2000) });
  return ok ? { ok: true } : fail(locale, "המשימה לא נשמרה.", "The task was not saved.");
}

export async function addTaskAction(projectId: string, phase: (typeof PHASES)[number], title: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const cleaned = title.trim().slice(0, 160);
  if (cleaned.length < 2) return fail(locale, "צריך כותרת למשימה.", "The task needs a title.");
  const id = addTask(db, user.id, projectId, { phase, title: cleaned, notes: "", priority: "medium", done: false, dependsOn: null });
  return id ? { ok: true } : fail(locale, "המשימה לא נוספה.", "The task was not added.");
}

export async function deleteTaskAction(projectId: string, taskId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  return deleteTask(db, user.id, projectId, taskId) ? { ok: true } : fail(locale, "המשימה לא נמחקה.", "The task was not deleted.");
}

export async function shareAction(projectId: string, enable: boolean): Promise<ActionResult & { token?: string }> {
  const { user, locale, db } = await actor();
  if (!enable) {
    revokeShare(db, user.id, projectId);
    return { ok: true };
  }
  const token = createShare(db, user.id, projectId);
  if (!token) return fail(locale, "לא נוצר קישור.", "A link was not created.");
  notify(db, { userId: user.id, projectId, title: text(locale, "נפתח קישור לקריאה", "A read-only link was opened"), body: text(locale, "אפשר לבטל אותו במסך הייצוא.", "You can revoke it on the export screen."), href: `/app/projects/${projectId}/export` });
  return { ok: true, token };
}

export async function deleteProjectAction(projectId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  if (!deleteProject(db, user.id, projectId)) return fail(locale, "הפרויקט לא נמחק.", "The project was not deleted.");
  redirect("/app");
}

export async function markReadAction(id: string) {
  const user = await currentUser();
  if (!user) return;
  markNotificationRead(getDb(), user.id, id);
}

export async function sectionHistory(projectId: string, key: string) {
  const { user, db } = await actor();
  return listSnapshots(db, user.id, projectId, `plan:${key}`) as { id: string; createdAt: string; data: { title: string; content: string } }[];
}

export async function restoreSectionAction(projectId: string, key: string, snapshotId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const history = listSnapshots(db, user.id, projectId, `plan:${key}`) as { id: string; data: { title: string; content: string } }[];
  const snapshot = history.find((item) => item.id === snapshotId);
  if (!snapshot) return fail(locale, "הגרסה לא נמצאה.", "The version was not found.");
  updatePlanSection(db, user.id, projectId, key, { title: snapshot.data.title, content: snapshot.data.content, origin: "user" });
  return { ok: true };
}

export async function generateBrandImageAction(projectId: string, brandId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const status = integrationStatus();
  if (!status.imageEnabled) return fail(locale, "יצירת תמונה לא מופעלת. מוצגים סקיצות לוגו לעריכה.", "Image generation is not enabled. Editable logo sketches are shown instead.");
  const bundle = getProject(db, user.id, projectId);
  const brand = bundle?.brands.find((item) => item.id === brandId);
  if (!bundle || !brand) return fail(locale, "הכיוון לא נמצא.", "The direction was not found.");
  if (!takeRateSlot(db, user.id, modelDailyLimit())) return fail(locale, "הגעתם למכסת היצירה היומית.", "You reached today’s generation limit.");
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "dall-e-3",
        prompt: `Flat editorial logo mark for a business named ${brand.chosenName}. Colors: ${brand.colors.map((color) => color.hex).join(", ")}. No photorealistic people, no trademarked logos, no text other than the name.`,
        size: "1024x1024",
        response_format: "b64_json",
      }),
    });
    if (!response.ok) throw new Error(`AI_${response.status}`);
    const payload = (await response.json()) as { data?: { b64_json?: string }[] };
    const b64 = payload.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI_NO_IMAGE");
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), "data", "media", projectId);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${brand.id}.png`;
    fs.writeFileSync(path.join(dir, filename), Buffer.from(b64, "base64"));
    updateBrand(db, user.id, projectId, { ...brand, generatedImage: `/api/media/${projectId}/${filename}` });
    logGeneration(db, { userId: user.id, projectId, kind: "image", status: "ok", mode: "model" });
    return { ok: true };
  } catch (error) {
    logGeneration(db, { userId: user.id, projectId, kind: "image", status: "error", mode: "model", message: error instanceof Error ? error.message : "failed" });
    return fail(locale, "יצירת התמונה נכשלה. הסקיצה הקיימת נשארה.", "Image generation failed. The existing sketch stayed.");
  }
}

export async function publishAction(projectId: string): Promise<ActionResult> {
  const { user, locale, db } = await actor();
  const hook = process.env.DEPLOY_HOOK_URL;
  if (!hook || !hook.startsWith("https://")) return fail(locale, "פרסום לא מוגדר. הייצוא הסטטי זמין בלי לפרסם.", "Publishing is not configured. The static export is available without publishing.");
  const bundle = getProject(db, user.id, projectId);
  if (!bundle) return fail(locale, "הפרויקט לא נמצא.", "The project was not found.");
  const response = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: bundle.id }) });
  if (!response.ok) return fail(locale, "קריאת הפרסום נכשלה. האתר לא סומן כפורסם.", "The publish call failed. The site was not marked published.");
  notify(db, { userId: user.id, projectId, title: text(locale, "נשלחה בקשת פרסום", "A publish request was sent"), body: text(locale, "החיבור החיצוני קיבל את הבקשה.", "The external hook accepted the request."), href: `/app/projects/${projectId}/website` });
  return { ok: true };
}
