import type {
  Analysis,
  Assumptions,
  BrandDirection,
  BusinessProfile,
  CalendarItem,
  FinanceScenario,
  GeneratedWorkspace,
  MarketingAsset,
  NotificationItem,
  PlanSection,
  ProjectBundle,
  ProjectSummary,
  RoadTask,
  WebsiteDoc,
} from "@/lib/domain";
import type { DB } from "@/lib/db";
import { transaction } from "@/lib/db";
import { nowIso, uid } from "@/lib/utils";
import { projectStatus } from "@/lib/progress";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  locale: string;
  theme: string;
  createdAt: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function userFrom(row: Record<string, unknown>): User {
  return {
    id: asString(row.id),
    name: asString(row.name),
    email: asString(row.email),
    passwordHash: asString(row.password_hash),
    locale: asString(row.locale),
    theme: asString(row.theme),
    createdAt: asString(row.created_at),
  };
}

export function createUser(db: DB, input: { name: string; email: string; passwordHash: string; locale: string }) {
  const id = uid();
  const createdAt = nowIso();
  db.prepare("INSERT INTO users (id, name, email, password_hash, locale, theme, created_at) VALUES (?, ?, ?, ?, ?, 'light', ?)").run(
    id,
    input.name,
    input.email,
    input.passwordHash,
    input.locale,
    createdAt,
  );
  return findUserById(db, id)!;
}

export function findUserByEmail(db: DB, email: string) {
  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  return row ? userFrom(row) : null;
}

export function findUserById(db: DB, id: string) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return row ? userFrom(row) : null;
}

export function createSession(db: DB, userId: string) {
  const id = uid();
  const createdAt = new Date();
  const expires = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * 30);
  db.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at < ?").run(userId, createdAt.toISOString());
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(
    id,
    userId,
    expires.toISOString(),
    createdAt.toISOString(),
  );
  return { id, expiresAt: expires.toISOString() };
}

export function userForSession(db: DB, sessionId: string) {
  const row = db.prepare(
    `SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > ?`,
  ).get(sessionId, nowIso());
  return row ? userFrom(row) : null;
}

export function deleteSession(db: DB, sessionId: string) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

function touch(db: DB, projectId: string) {
  db.prepare("UPDATE projects SET updated_at = ? WHERE id = ?").run(nowIso(), projectId);
}

function owns(db: DB, userId: string, projectId: string) {
  return Boolean(db.prepare("SELECT id FROM projects WHERE id = ? AND user_id = ?").get(projectId, userId));
}

export function snapshot(db: DB, projectId: string, kind: string, data: unknown) {
  db.prepare("INSERT INTO snapshots (id, project_id, kind, data_json, created_at) VALUES (?, ?, ?, ?, ?)").run(
    uid(),
    projectId,
    kind,
    JSON.stringify(data),
    nowIso(),
  );
  const stale = db.prepare(
    "SELECT id FROM snapshots WHERE project_id = ? AND kind = ? ORDER BY created_at DESC LIMIT -1 OFFSET 30",
  ).all(projectId, kind);
  for (const row of stale) db.prepare("DELETE FROM snapshots WHERE id = ?").run(asString(row.id));
}

export function listSnapshots(db: DB, userId: string, projectId: string, kind: string) {
  if (!owns(db, userId, projectId)) return [];
  return db
    .prepare("SELECT id, data_json, created_at FROM snapshots WHERE project_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 20")
    .all(projectId, kind)
    .map((row) => ({ id: asString(row.id), data: JSON.parse(asString(row.data_json)), createdAt: asString(row.created_at) }));
}

export function notify(db: DB, input: { userId: string; projectId?: string | null; title: string; body: string; href?: string | null }) {
  db.prepare("INSERT INTO notifications (id, user_id, project_id, title, body, href, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)").run(
    uid(),
    input.userId,
    input.projectId ?? null,
    input.title,
    input.body,
    input.href ?? null,
    nowIso(),
  );
}

export function insertWorkspace(
  db: DB,
  userId: string,
  profile: BusinessProfile,
  workspace: GeneratedWorkspace,
  mode: "preliminary" | "model",
) {
  const projectId = uid();
  const stamp = nowIso();
  transaction(db, () => {
    db.prepare(
      "INSERT INTO projects (id, user_id, name, idea, profile_json, generation_mode, selected_brand_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)",
    ).run(projectId, userId, profile.displayName, profile.idea, JSON.stringify(profile), mode, stamp, stamp);
    db.prepare("INSERT INTO analyses (project_id, content_json, updated_at) VALUES (?, ?, ?)").run(
      projectId,
      JSON.stringify({ ...workspace.analysis, mode }),
      stamp,
    );
    workspace.plan.forEach((section, index) => {
      db.prepare(
        "INSERT INTO plan_sections (id, project_id, section_key, title, content, locked, origin, position, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)",
      ).run(uid(), projectId, section.key, section.title, section.content, mode, index, stamp);
    });
    workspace.brands.forEach((brand, index) => {
      db.prepare("INSERT INTO brand_directions (id, project_id, data_json, position, updated_at) VALUES (?, ?, ?, ?, ?)").run(
        brand.id,
        projectId,
        JSON.stringify(brand),
        index,
        stamp,
      );
    });
    db.prepare("INSERT INTO websites (project_id, data_json, updated_at) VALUES (?, ?, ?)").run(projectId, JSON.stringify(workspace.website), stamp);
    workspace.scenarios.forEach((scenario) => {
      db.prepare(
        "INSERT INTO finance_scenarios (id, project_id, scenario_key, name, assumptions_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(uid(), projectId, scenario.key, scenario.name, JSON.stringify(scenario.assumptions), stamp);
    });
    workspace.marketing.forEach((asset, index) => {
      db.prepare(
        "INSERT INTO marketing_assets (id, project_id, kind, title, content, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ).run(uid(), projectId, asset.kind, asset.title, asset.content, index, stamp);
    });
    const calendar = workspace.calendar.map((item) => ({ ...item, id: uid() }));
    db.prepare("INSERT INTO marketing_calendars (project_id, items_json, updated_at) VALUES (?, ?, ?)").run(projectId, JSON.stringify(calendar), stamp);
    const taskIds = workspace.tasks.map(() => uid());
    workspace.tasks.forEach((task, index) => {
      const depends = task.dependsOnIndex === null ? null : taskIds[task.dependsOnIndex] ?? null;
      db.prepare(
        "INSERT INTO roadmap_tasks (id, project_id, phase, title, notes, priority, done, depends_on, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)",
      ).run(taskIds[index], projectId, task.phase, task.title, task.notes, task.priority, depends, index, stamp);
    });
    notify(db, {
      userId,
      projectId,
      title: profile.locale === "he" ? "סביבת העבודה נשמרה" : "Workspace saved",
      body: profile.locale === "he" ? "הניתוח, התוכנית, המותג, האתר, המספרים ומפת הדרכים נשמרו לפרויקט." : "The analysis, plan, brand, site, numbers, and roadmap were saved.",
      href: `/app/projects/${projectId}`,
    });
    db.prepare("INSERT INTO generations (id, user_id, project_id, kind, status, mode, message, created_at) VALUES (?, ?, ?, 'workspace', 'ok', ?, NULL, ?)").run(
      uid(),
      userId,
      projectId,
      mode,
      stamp,
    );
  });
  return projectId;
}

function bundleFrom(db: DB, projectRow: Record<string, unknown>): ProjectBundle {
  const id = asString(projectRow.id);
  const analysisRow = db.prepare("SELECT content_json, updated_at FROM analyses WHERE project_id = ?").get(id);
  const plan = db
    .prepare("SELECT * FROM plan_sections WHERE project_id = ? ORDER BY position")
    .all(id)
    .map((row) => ({
      id: asString(row.id),
      key: asString(row.section_key) as PlanSection["key"],
      title: asString(row.title),
      content: asString(row.content),
      locked: asNumber(row.locked) === 1,
      origin: asString(row.origin) as PlanSection["origin"],
      position: asNumber(row.position),
      updatedAt: asString(row.updated_at),
    }));
  const brands = db
    .prepare("SELECT data_json FROM brand_directions WHERE project_id = ? ORDER BY position")
    .all(id)
    .map((row) => JSON.parse(asString(row.data_json)) as BrandDirection);
  const websiteRow = db.prepare("SELECT data_json FROM websites WHERE project_id = ?").get(id);
  const scenarios = db
    .prepare("SELECT * FROM finance_scenarios WHERE project_id = ? ORDER BY scenario_key")
    .all(id)
    .map((row) => ({
      id: asString(row.id),
      key: asString(row.scenario_key) as FinanceScenario["key"],
      name: asString(row.name),
      assumptions: JSON.parse(asString(row.assumptions_json)) as Assumptions,
      updatedAt: asString(row.updated_at),
    }));
  const marketing = db
    .prepare("SELECT * FROM marketing_assets WHERE project_id = ? ORDER BY position")
    .all(id)
    .map((row) => ({
      id: asString(row.id),
      kind: asString(row.kind),
      title: asString(row.title),
      content: asString(row.content),
      position: asNumber(row.position),
      updatedAt: asString(row.updated_at),
    }));
  const calendarRow = db.prepare("SELECT items_json FROM marketing_calendars WHERE project_id = ?").get(id);
  const tasks = db
    .prepare("SELECT * FROM roadmap_tasks WHERE project_id = ? ORDER BY position")
    .all(id)
    .map((row) => ({
      id: asString(row.id),
      phase: asString(row.phase) as RoadTask["phase"],
      title: asString(row.title),
      notes: asString(row.notes),
      priority: asString(row.priority) as RoadTask["priority"],
      done: asNumber(row.done) === 1,
      dependsOn: row.depends_on ? asString(row.depends_on) : null,
      position: asNumber(row.position),
      updatedAt: asString(row.updated_at),
    }));
  const share = db.prepare("SELECT token, revoked FROM shares WHERE project_id = ?").get(id);
  return {
    id,
    userId: asString(projectRow.user_id),
    name: asString(projectRow.name),
    idea: asString(projectRow.idea),
    profile: JSON.parse(asString(projectRow.profile_json)) as BusinessProfile,
    generationMode: asString(projectRow.generation_mode) as ProjectBundle["generationMode"],
    createdAt: asString(projectRow.created_at),
    updatedAt: asString(projectRow.updated_at),
    analysis: JSON.parse(asString(analysisRow?.content_json)) as Analysis,
    plan,
    brands,
    selectedBrandId: projectRow.selected_brand_id ? asString(projectRow.selected_brand_id) : null,
    website: JSON.parse(asString(websiteRow?.data_json)) as WebsiteDoc,
    scenarios,
    marketing,
    calendar: JSON.parse(asString(calendarRow?.items_json ?? "[]")) as CalendarItem[],
    tasks,
    shareToken: share ? asString(share.token) : null,
    shareRevoked: share ? asNumber(share.revoked) === 1 : true,
  };
}

export function getProject(db: DB, userId: string, projectId: string) {
  const row = db.prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?").get(projectId, userId);
  return row ? bundleFrom(db, row) : null;
}

export function getSharedProject(db: DB, token: string) {
  const share = db.prepare("SELECT project_id, revoked FROM shares WHERE token = ?").get(token);
  if (!share || asNumber(share.revoked) === 1) return null;
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(asString(share.project_id));
  return row ? bundleFrom(db, row) : null;
}

export function listProjects(db: DB, userId: string): ProjectSummary[] {
  const rows = db.prepare("SELECT id FROM projects WHERE user_id = ? ORDER BY updated_at DESC").all(userId);
  return rows.map((row) => {
    const bundle = getProject(db, userId, asString(row.id))!;
    const status = projectStatus(bundle);
    return {
      id: bundle.id,
      name: bundle.name,
      idea: bundle.idea,
      location: bundle.profile.location,
      currency: bundle.profile.currency,
      budget: bundle.profile.budget,
      generationMode: bundle.generationMode,
      updatedAt: bundle.updatedAt,
      progress: status.percent,
      nextHref: status.nextHref,
      nextLabel: status.nextLabel,
    };
  });
}

export function listNotifications(db: DB, userId: string): NotificationItem[] {
  return db
    .prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 12")
    .all(userId)
    .map((row) => ({
      id: asString(row.id),
      projectId: row.project_id ? asString(row.project_id) : null,
      title: asString(row.title),
      body: asString(row.body),
      href: row.href ? asString(row.href) : null,
      read: asNumber(row.read) === 1,
      createdAt: asString(row.created_at),
    }));
}

export function markNotificationRead(db: DB, userId: string, id: string) {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, userId);
}

export function updateProfile(db: DB, userId: string, projectId: string, profile: BusinessProfile, name: string) {
  if (!owns(db, userId, projectId)) return false;
  db.prepare("UPDATE projects SET profile_json = ?, name = ?, idea = ? WHERE id = ?").run(JSON.stringify(profile), name, profile.idea, projectId);
  touch(db, projectId);
  return true;
}

export function updateAnalysis(db: DB, userId: string, projectId: string, analysis: Analysis) {
  if (!owns(db, userId, projectId)) return false;
  const current = db.prepare("SELECT content_json FROM analyses WHERE project_id = ?").get(projectId);
  if (current) snapshot(db, projectId, "analysis", JSON.parse(asString(current.content_json)));
  db.prepare("UPDATE analyses SET content_json = ?, updated_at = ? WHERE project_id = ?").run(JSON.stringify(analysis), nowIso(), projectId);
  touch(db, projectId);
  return true;
}

export function updatePlanSection(db: DB, userId: string, projectId: string, key: string, patch: { title?: string; content?: string; locked?: boolean; origin?: string }) {
  if (!owns(db, userId, projectId)) return false;
  const current = db.prepare("SELECT * FROM plan_sections WHERE project_id = ? AND section_key = ?").get(projectId, key);
  if (!current) return false;
  if (patch.content !== undefined && patch.content !== asString(current.content)) {
    snapshot(db, projectId, `plan:${key}`, { title: asString(current.title), content: asString(current.content) });
  }
  db.prepare("UPDATE plan_sections SET title = ?, content = ?, locked = ?, origin = ?, updated_at = ? WHERE project_id = ? AND section_key = ?").run(
    patch.title ?? asString(current.title),
    patch.content ?? asString(current.content),
    patch.locked === undefined ? asNumber(current.locked) : patch.locked ? 1 : 0,
    patch.origin ?? asString(current.origin),
    nowIso(),
    projectId,
    key,
  );
  touch(db, projectId);
  return true;
}

export function updateBrand(db: DB, userId: string, projectId: string, brand: BrandDirection) {
  if (!owns(db, userId, projectId)) return false;
  const current = db.prepare("SELECT data_json FROM brand_directions WHERE project_id = ? AND id = ?").get(projectId, brand.id);
  if (!current) return false;
  snapshot(db, projectId, `brand:${brand.id}`, JSON.parse(asString(current.data_json)));
  db.prepare("UPDATE brand_directions SET data_json = ?, updated_at = ? WHERE id = ? AND project_id = ?").run(JSON.stringify(brand), nowIso(), brand.id, projectId);
  touch(db, projectId);
  return true;
}

export function selectBrand(db: DB, userId: string, projectId: string, brandId: string) {
  if (!owns(db, userId, projectId)) return false;
  const row = db.prepare("SELECT id FROM brand_directions WHERE project_id = ? AND id = ?").get(projectId, brandId);
  if (!row) return false;
  db.prepare("UPDATE projects SET selected_brand_id = ? WHERE id = ?").run(brandId, projectId);
  touch(db, projectId);
  return true;
}

export function replaceBrands(db: DB, userId: string, projectId: string, brands: BrandDirection[]) {
  if (!owns(db, userId, projectId)) return false;
  transaction(db, () => {
    const existing = db.prepare("SELECT data_json FROM brand_directions WHERE project_id = ?").all(projectId);
    snapshot(db, projectId, "brands", existing.map((row) => JSON.parse(asString(row.data_json))));
    db.prepare("DELETE FROM brand_directions WHERE project_id = ?").run(projectId);
    brands.forEach((brand, index) => {
      db.prepare("INSERT INTO brand_directions (id, project_id, data_json, position, updated_at) VALUES (?, ?, ?, ?, ?)").run(
        brand.id,
        projectId,
        JSON.stringify(brand),
        index,
        nowIso(),
      );
    });
    db.prepare("UPDATE projects SET selected_brand_id = NULL WHERE id = ?").run(projectId);
    touch(db, projectId);
  });
  return true;
}

export function updateWebsite(db: DB, userId: string, projectId: string, website: WebsiteDoc) {
  if (!owns(db, userId, projectId)) return false;
  const current = db.prepare("SELECT data_json FROM websites WHERE project_id = ?").get(projectId);
  if (current) snapshot(db, projectId, "website", JSON.parse(asString(current.data_json)));
  db.prepare("UPDATE websites SET data_json = ?, updated_at = ? WHERE project_id = ?").run(JSON.stringify(website), nowIso(), projectId);
  touch(db, projectId);
  return true;
}

export function updateScenario(db: DB, userId: string, projectId: string, key: string, name: string, assumptions: Assumptions) {
  if (!owns(db, userId, projectId)) return false;
  const current = db.prepare("SELECT assumptions_json FROM finance_scenarios WHERE project_id = ? AND scenario_key = ?").get(projectId, key);
  if (!current) return false;
  snapshot(db, projectId, `finance:${key}`, JSON.parse(asString(current.assumptions_json)));
  db.prepare("UPDATE finance_scenarios SET name = ?, assumptions_json = ?, updated_at = ? WHERE project_id = ? AND scenario_key = ?").run(
    name,
    JSON.stringify(assumptions),
    nowIso(),
    projectId,
    key,
  );
  touch(db, projectId);
  return true;
}

export function updateMarketing(db: DB, userId: string, projectId: string, assets: MarketingAsset[]) {
  if (!owns(db, userId, projectId)) return false;
  transaction(db, () => {
    for (const asset of assets) {
      db.prepare("UPDATE marketing_assets SET title = ?, content = ?, updated_at = ? WHERE id = ? AND project_id = ?").run(
        asset.title,
        asset.content,
        nowIso(),
        asset.id,
        projectId,
      );
    }
    touch(db, projectId);
  });
  return true;
}

export function updateCalendar(db: DB, userId: string, projectId: string, items: CalendarItem[]) {
  if (!owns(db, userId, projectId)) return false;
  db.prepare("UPDATE marketing_calendars SET items_json = ?, updated_at = ? WHERE project_id = ?").run(JSON.stringify(items), nowIso(), projectId);
  touch(db, projectId);
  return true;
}

export function saveTask(db: DB, userId: string, projectId: string, task: RoadTask) {
  if (!owns(db, userId, projectId)) return false;
  const result = db.prepare(
    "UPDATE roadmap_tasks SET title = ?, notes = ?, priority = ?, done = ?, depends_on = ?, phase = ?, updated_at = ? WHERE id = ? AND project_id = ?",
  ).run(task.title, task.notes, task.priority, task.done ? 1 : 0, task.dependsOn, task.phase, nowIso(), task.id, projectId);
  touch(db, projectId);
  return Number(result.changes) > 0;
}

export function addTask(db: DB, userId: string, projectId: string, task: Omit<RoadTask, "id" | "updatedAt" | "position">) {
  if (!owns(db, userId, projectId)) return null;
  const positionRow = db.prepare("SELECT COALESCE(MAX(position), -1) AS max_position FROM roadmap_tasks WHERE project_id = ?").get(projectId);
  const id = uid();
  db.prepare(
    "INSERT INTO roadmap_tasks (id, project_id, phase, title, notes, priority, done, depends_on, position, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, projectId, task.phase, task.title, task.notes, task.priority, task.done ? 1 : 0, task.dependsOn, asNumber(positionRow?.max_position) + 1, nowIso());
  touch(db, projectId);
  return id;
}

export function deleteTask(db: DB, userId: string, projectId: string, taskId: string) {
  if (!owns(db, userId, projectId)) return false;
  db.prepare("UPDATE roadmap_tasks SET depends_on = NULL WHERE project_id = ? AND depends_on = ?").run(projectId, taskId);
  const result = db.prepare("DELETE FROM roadmap_tasks WHERE id = ? AND project_id = ?").run(taskId, projectId);
  touch(db, projectId);
  return Number(result.changes) > 0;
}

export function recordExport(db: DB, userId: string, projectId: string, kind: string) {
  db.prepare("INSERT INTO exports (id, project_id, user_id, kind, created_at) VALUES (?, ?, ?, ?, ?)").run(uid(), projectId, userId, kind, nowIso());
}

export function listExports(db: DB, userId: string, projectId: string) {
  if (!owns(db, userId, projectId)) return [];
  return db
    .prepare("SELECT kind, created_at FROM exports WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 12")
    .all(projectId, userId)
    .map((row) => ({ kind: asString(row.kind), createdAt: asString(row.created_at) }));
}

export function createShare(db: DB, userId: string, projectId: string) {
  if (!owns(db, userId, projectId)) return null;
  const existing = db.prepare("SELECT token FROM shares WHERE project_id = ?").get(projectId);
  if (existing) {
    db.prepare("UPDATE shares SET revoked = 0 WHERE project_id = ?").run(projectId);
    return asString(existing.token);
  }
  const token = uid().replaceAll("-", "") + uid().replaceAll("-", "").slice(0, 8);
  db.prepare("INSERT INTO shares (project_id, token, revoked, created_at) VALUES (?, ?, 0, ?)").run(projectId, token, nowIso());
  return token;
}

export function revokeShare(db: DB, userId: string, projectId: string) {
  if (!owns(db, userId, projectId)) return false;
  db.prepare("UPDATE shares SET revoked = 1 WHERE project_id = ?").run(projectId);
  return true;
}

export function deleteProject(db: DB, userId: string, projectId: string) {
  const result = db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?").run(projectId, userId);
  return Number(result.changes) > 0;
}

export function takeRateSlot(db: DB, userId: string, limit: number) {
  const day = nowIso().slice(0, 10);
  return transaction(db, () => {
    const row = db.prepare("SELECT count FROM rate_limits WHERE user_id = ? AND day = ?").get(userId, day);
    const count = row ? asNumber(row.count) : 0;
    if (count >= limit) return false;
    if (!row) db.prepare("INSERT INTO rate_limits (user_id, day, count) VALUES (?, ?, 1)").run(userId, day);
    else db.prepare("UPDATE rate_limits SET count = ? WHERE user_id = ? AND day = ?").run(count + 1, userId, day);
    return true;
  });
}

export function logGeneration(db: DB, input: { userId: string; projectId?: string | null; kind: string; status: "ok" | "error"; mode: string; message?: string }) {
  db.prepare("INSERT INTO generations (id, user_id, project_id, kind, status, mode, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
    uid(),
    input.userId,
    input.projectId ?? null,
    input.kind,
    input.status,
    input.mode,
    input.message?.slice(0, 180) ?? null,
    nowIso(),
  );
}

export function updateUserPrefs(db: DB, userId: string, patch: { name?: string; locale?: string; theme?: string }) {
  const user = findUserById(db, userId);
  if (!user) return;
  db.prepare("UPDATE users SET name = ?, locale = ?, theme = ? WHERE id = ?").run(patch.name ?? user.name, patch.locale ?? user.locale, patch.theme ?? user.theme, userId);
}
