import type {
  BudgetSource,
  BusinessInput,
  BusinessProfile,
  CurrencyCode,
  ExperienceLevel,
  IndustryKey,
  PricingTier,
} from "@/lib/domain";

const RATES: Record<CurrencyCode, number> = { ILS: 1, USD: 3.7, EUR: 4 };

export function fromIls(amountIls: number, currency: CurrencyCode) {
  return Math.max(0, Math.round(amountIls / RATES[currency]));
}

const CURRENCY_TOKEN: { pattern: RegExp; code: CurrencyCode }[] = [
  { pattern: /₪|ש״ח|ש"ח|שקלים|שקל|\bils\b|shekels?/i, code: "ILS" },
  { pattern: /\$|\busd\b|דולרים|דולר/i, code: "USD" },
  { pattern: /€|\beur\b|יורו/i, code: "EUR" },
];

export function mentionedBudget(idea: string, selected: CurrencyCode): number | null {
  const patterns = [
    /(?:תקציב|budget)[^\d]{0,40}(\d{2,9}(?:[,\s]\d{3})*)/i,
    /(\d{2,9}(?:[,\s]\d{3})*)\s*(₪|ש״ח|ש"ח|שקלים|שקל|ils|shekels?|\$|usd|דולרים|דולר|€|eur|יורו)/i,
  ];
  for (const pattern of patterns) {
    const match = idea.match(pattern);
    if (!match) continue;
    const raw = Number(match[1].replace(/[,\s]/g, ""));
    if (!Number.isFinite(raw) || raw < 100 || raw > 100_000_000) continue;
    const window = idea.slice(Math.max(0, (match.index ?? 0) - 12), (match.index ?? 0) + match[0].length + 16);
    const found = CURRENCY_TOKEN.find((item) => item.pattern.test(window))?.code ?? selected;
    if (found === selected) return raw;
    return fromIls(raw * RATES[found], selected);
  }
  return null;
}

export function budgetOrigin(profile: Pick<BusinessProfile, "budgetProvided" | "budgetSource">): BudgetSource {
  if (profile.budgetSource) return profile.budgetSource;
  return profile.budgetProvided ? "entered" : "default";
}

export function text(locale: BusinessProfile["locale"], he: string, en: string) {
  return locale === "he" ? he : en;
}

const LABELS: Record<IndustryKey, { he: string; en: string }> = {
  apparel: { he: "אופנה והלבשה", en: "Apparel" },
  fitness: { he: "כושר ואימון", en: "Fitness" },
  food: { he: "מזון ומשקאות", en: "Food and drink" },
  saas: { he: "תוכנה במנוי", en: "Subscription software" },
  services: { he: "שירותים מקצועיים", en: "Professional services" },
  education: { he: "חינוך והדרכה", en: "Education" },
  beauty: { he: "טיפוח ויופי", en: "Beauty" },
  hospitality: { he: "אירוח", en: "Hospitality" },
  retail: { he: "קמעונאות", en: "Retail" },
  general: { he: "עסק חדש", en: "New business" },
};

export function industryLabel(key: IndustryKey, locale: BusinessProfile["locale"], angle: string) {
  if (key === "apparel" && angle === "fitness") return text(locale, "ביגוד כושר", "Training apparel");
  if (key === "food" && angle === "coffee") return text(locale, "קפה", "Coffee");
  return LABELS[key][locale];
}

export function experienceLabel(level: ExperienceLevel, locale: BusinessProfile["locale"]) {
  const map = {
    first: ["מיזם ראשון", "First venture"],
    some: ["יש ניסיון חלקי", "Some experience"],
    operating: ["כבר מפעילים פעילות", "Already operating"],
  } as const;
  return text(locale, map[level][0], map[level][1]);
}

export function businessTypeLabel(type: BusinessInput["businessType"], locale: BusinessProfile["locale"]) {
  const map = {
    product: ["מוצר", "Product"],
    service: ["שירות", "Service"],
    saas: ["תוכנה במנוי", "Subscription software"],
    marketplace: ["זירה שמחברת צדדים", "Marketplace"],
    retail: ["קמעונאות", "Retail"],
    hybrid: ["שילוב של מוצר ושירות", "Product and service"],
  } as const;
  return text(locale, map[type][0], map[type][1]);
}

export function tierLabel(tier: PricingTier, locale: BusinessProfile["locale"]) {
  const map = {
    value: ["מחיר נגיש", "Accessible price"],
    mid: ["מחיר אמצע", "Mid price"],
    premium: ["מחיר פרימיום", "Premium price"],
    luxury: ["מחיר יוקרה", "Luxury price"],
  } as const;
  return text(locale, map[tier][0], map[tier][1]);
}

function detectIndustry(idea: string): IndustryKey {
  const rules: [IndustryKey, RegExp][] = [
    ["apparel", /בגד|לבוש|אופנה|ביגוד|clothing|apparel|fashion|hoodie|leggings|טייץ/i],
    ["food", /קפה|coffee|מאפי|מסעד|אוכל|food|beverage|bar\b|יין/i],
    ["saas", /saas|תוכנה|אפליקציה|software|platform/i],
    ["beauty", /טיפוח|קוסמט|שיער|skincare|beauty|איפור/i],
    ["education", /קורס|לימוד|הדרכה|course|cohort|חינוך/i],
    ["hospitality", /מלון|אירוח|צימר|hotel|guest house/i],
    ["fitness", /כושר|חדר כושר|אימון|gym|fitness|yoga|יוגה|פילאטיס/i],
    ["retail", /חנות|קמעונ|retail|חנות אונליין/i],
    ["services", /ייעוץ|סוכנות|שירות|agency|consult|סטודיו/i],
  ];
  return rules.find(([, pattern]) => pattern.test(idea))?.[0] ?? "general";
}

function detectAngle(idea: string, industry: IndustryKey) {
  if (industry === "apparel" && /כושר|fitness|אימון|gym|yoga|יוגה|ספורט|ריצה|run/i.test(idea)) return "fitness";
  if (industry === "food" && /קפה|coffee/i.test(idea)) return "coffee";
  return "";
}

function detectTier(blob: string): PricingTier {
  if (/luxury|יוקרה|אולטרה פרימיום/i.test(blob)) return "luxury";
  if (/premium|פרימיום|בוטיק|יוקרתי/i.test(blob)) return "premium";
  if (/budget|זול|נגיש|חסכונ/i.test(blob)) return "value";
  return "mid";
}

export function normalizeInput(input: BusinessInput): BusinessProfile {
  const idea = input.idea.trim().replace(/\s+/g, " ");
  const industryKey = input.industryKey === "general" ? detectIndustry(idea) : input.industryKey;
  const angle = detectAngle(idea, industryKey);
  const locale = input.locale;
  const label = industryLabel(industryKey, locale, angle);
  const location = input.location.trim();
  const budgetProvided = input.budget !== null && Number.isFinite(input.budget);
  const mentioned = budgetProvided ? null : mentionedBudget(idea, input.currency);
  const budgetSource: BudgetSource = budgetProvided ? "entered" : mentioned === null ? "default" : "mentioned";
  const budget = budgetProvided ? Math.max(0, Number(input.budget)) : mentioned ?? fromIls(20_000, input.currency);
  const isIsrael = /ישראל|israel|תל[\s-]?אביב|tel aviv|ירושלים|jerusalem|חיפה|haifa|באר שבע|הרצליה|רמת גן|גבעתיים/i.test(
    `${location} ${idea}`,
  );
  const display = location ? `${label} · ${location}` : label;
  return {
    idea,
    industryKey,
    industryLabel: label,
    angle,
    location,
    currency: input.currency,
    budget,
    budgetProvided,
    budgetSource,
    audience: input.audience.trim(),
    experience: input.experience,
    businessType: input.businessType,
    goals: input.goals.trim(),
    locale,
    pricingTier: detectTier(`${idea} ${input.goals} ${input.audience}`),
    isIsrael,
    displayName: display.slice(0, 80),
    financeReviewed: false,
    marketingReviewed: false,
  };
}

export function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function initials(name: string) {
  const words = name.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  const letters = words.slice(0, 2).map((word) => [...word][0] ?? "");
  const value = letters.join("");
  return /[A-Za-z]/.test(value) ? value.toUpperCase() : value || name.slice(0, 1);
}

export function pickRotated<T>(items: T[], start: number, count: number) {
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}
