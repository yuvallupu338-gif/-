import { z } from "zod";
import { PLAN_KEYS, type BusinessProfile, type GeneratedWorkspace, type PlanKey } from "@/lib/domain";
import { buildWorkspace, rebuildSection } from "@/lib/consultant/compose";

const planKeySchema = z.enum([
  "executive",
  "problem",
  "audience",
  "market",
  "competitors",
  "revenue",
  "operations",
  "marketing",
  "financials",
  "risks",
  "milestones",
]);

const sectionSchema = z.object({
  key: planKeySchema,
  title: z.string().min(1).max(80),
  content: z.string().min(40).max(8000),
});

const workspaceSchema = z.object({
  opportunity: z.string().min(40),
  assumptions: z.array(z.string().min(3)).min(3).max(8),
  strengths: z.array(z.string().min(3)).min(2).max(6),
  weaknesses: z.array(z.string().min(3)).min(2).max(6),
  customerProblems: z.array(z.string().min(3)).min(2).max(6),
  differentiation: z.string().min(20),
  revenueModels: z.array(z.object({ name: z.string().min(1), description: z.string().min(8) })).min(2).max(4),
  risks: z.array(z.object({ title: z.string(), detail: z.string(), mitigation: z.string() })).min(2).max(6),
  plan: z.array(sectionSchema).length(PLAN_KEYS.length),
});

export type AiStatus = {
  configured: boolean;
  provider: "openai" | "anthropic" | "gateway" | null;
  imageEnabled: boolean;
  publishEnabled: boolean;
  supabaseConfigured: boolean;
};

export function integrationStatus(): AiStatus {
  const openai = Boolean(process.env.OPENAI_API_KEY);
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const gateway = Boolean(process.env.AI_GATEWAY_API_KEY);
  return {
    configured: openai || anthropic || gateway,
    provider: openai ? "openai" : anthropic ? "anthropic" : gateway ? "gateway" : null,
    imageEnabled: openai && process.env.AI_IMAGE_ENABLED === "true",
    publishEnabled: Boolean(process.env.DEPLOY_HOOK_URL && process.env.DEPLOY_HOOK_URL.startsWith("https://")),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function modelDailyLimit() {
  const parsed = Number(process.env.AI_DAILY_LIMIT ?? 30);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

function systemPrompt(locale: BusinessProfile["locale"]) {
  return [
    `Write in ${locale === "he" ? "Hebrew" : "English"}.`,
    "You are a careful business planning assistant.",
    "Do not invent market sizes, growth rates, competitor facts, or statistics.",
    "If a fact is unknown, say what to verify.",
    "Never promise profitability or trademark clearance.",
    "Return only JSON.",
  ].join(" ");
}

async function complete(prompt: string, locale: BusinessProfile["locale"]) {
  const status = integrationStatus();
  if (!status.provider) throw new Error("AI_NOT_CONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const content = await callProvider(status.provider, systemPrompt(locale), prompt, controller.signal);
    return content;
  } finally {
    clearTimeout(timer);
  }
}

async function callProvider(provider: NonNullable<AiStatus["provider"]>, system: string, prompt: string, signal: AbortSignal) {
  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        max_tokens: 6000,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`AI_${response.status}`);
    const payload = (await response.json()) as { content?: { text?: string }[] };
    return payload.content?.map((part) => part.text ?? "").join("\n") ?? "";
  }
  const url = provider === "gateway"
    ? process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const key = provider === "gateway" ? process.env.AI_GATEWAY_API_KEY : process.env.OPENAI_API_KEY;
  const model = provider === "gateway" ? process.env.AI_GATEWAY_MODEL || "openai/gpt-4o-mini" : process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${key ?? ""}` },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI_${response.status}`);
  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return payload.choices?.[0]?.message?.content ?? "";
}

export function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI_BAD_JSON");
  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

function profilePrompt(profile: BusinessProfile) {
  return JSON.stringify({
    idea: profile.idea,
    industry: profile.industryLabel,
    location: profile.location,
    currency: profile.currency,
    budget: profile.budget,
    budgetProvided: profile.budgetProvided,
    budgetSource: profile.budgetSource ?? (profile.budgetProvided ? "entered" : "default"),
    audience: profile.audience,
    experience: profile.experience,
    businessType: profile.businessType,
    goals: profile.goals,
    pricingTier: profile.pricingTier,
    israel: profile.isIsrael,
  });
}

export async function generateModeledWorkspace(profile: BusinessProfile): Promise<GeneratedWorkspace> {
  const preliminary = buildWorkspace(profile);
  const prompt = `Business profile:\n${profilePrompt(profile)}\n\nReturn JSON with keys opportunity, assumptions, strengths, weaknesses, customerProblems, differentiation, revenueModels [{name, description}], risks [{title, detail, mitigation}], and plan. plan must be an array with exactly these keys in order: ${PLAN_KEYS.join(", ")}. Each plan item is {key, title, content}. Content is specific to this profile. No invented statistics.`;
  let parsed: z.infer<typeof workspaceSchema> | null = null;
  let lastError = "AI_BAD_JSON";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await complete(attempt === 0 ? prompt : `${prompt}\n\nThe previous response was invalid. Return only the JSON object.`, profile.locale);
      parsed = workspaceSchema.parse(extractJsonObject(raw));
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "AI_FAILED";
    }
  }
  if (!parsed) throw new Error(lastError.startsWith("AI_") ? lastError : "AI_FAILED");
  const byKey = new Map(parsed.plan.map((section) => [section.key, section]));
  if (PLAN_KEYS.some((key) => !byKey.has(key))) throw new Error("AI_BAD_JSON");
  return {
    ...preliminary,
    analysis: {
      mode: "model",
      disclaimer: profile.locale === "he"
        ? "נוצר בעזרת מודל שפה. לא בוצע מחקר שוק חי. אין כאן נתונים מאומתים או הבטחת רווח."
        : "Created with a language model. No live market research was run. There are no verified figures and no profit promise.",
      opportunity: parsed.opportunity,
      assumptions: parsed.assumptions,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      customerProblems: parsed.customerProblems,
      differentiation: parsed.differentiation,
      revenueModels: parsed.revenueModels,
      risks: parsed.risks,
    },
    plan: PLAN_KEYS.map((key) => byKey.get(key)!),
  };
}

const partialSchema = z.object({ title: z.string().min(1).max(80), content: z.string().min(40).max(8000) });

export async function generateModeledSection(profile: BusinessProfile, key: PlanKey, brandSummary: string) {
  const prompt = `Business profile:\n${profilePrompt(profile)}\nSelected brand:\n${brandSummary}\nRewrite only the business plan section "${key}". Return JSON {title, content}. Do not invent statistics.`;
  let lastError = "AI_BAD_JSON";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await complete(prompt, profile.locale);
      return partialSchema.parse(extractJsonObject(raw));
    } catch (error) {
      lastError = error instanceof Error ? error.message : "AI_FAILED";
    }
  }
  throw new Error(lastError.startsWith("AI_") ? lastError : "AI_FAILED");
}

export function preliminarySection(profile: BusinessProfile, key: PlanKey) {
  return rebuildSection(profile, key);
}
