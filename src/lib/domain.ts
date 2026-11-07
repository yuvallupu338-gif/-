export const LOCALES = ["he", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const INDUSTRIES = [
  "apparel",
  "fitness",
  "food",
  "saas",
  "services",
  "education",
  "beauty",
  "hospitality",
  "retail",
  "general",
] as const;
export type IndustryKey = (typeof INDUSTRIES)[number];

export const BUSINESS_TYPES = ["product", "service", "saas", "marketplace", "retail", "hybrid"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const EXPERIENCE_LEVELS = ["first", "some", "operating"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const PRICING_TIERS = ["value", "mid", "premium", "luxury"] as const;
export type PricingTier = (typeof PRICING_TIERS)[number];

export const CURRENCIES = ["ILS", "USD", "EUR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const PLAN_KEYS = [
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
] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const PHASES = [
  "validation",
  "planning",
  "branding",
  "setup",
  "website",
  "marketing",
  "launch",
  "growth",
] as const;
export type PhaseKey = (typeof PHASES)[number];

export const LOGO_STYLES = ["wordmark", "seal", "monogram", "bar"] as const;
export type LogoStyle = (typeof LOGO_STYLES)[number];

export const SECTION_TYPES = [
  "nav",
  "hero",
  "about",
  "products",
  "pricing",
  "features",
  "faq",
  "contact",
  "footer",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export type LineItem = {
  id: string;
  name: string;
  amount: number;
  source: "input" | "estimate";
};

export type Assumptions = {
  startupItems: LineItem[];
  monthlyItems: LineItem[];
  price: number;
  cogsRatio: number;
  startingCustomers: number;
  monthlyGrowth: number;
  horizon: number;
  openingCash: number;
  openingCashSource: "input" | "estimate";
  notes: string;
};

export type BudgetSource = "entered" | "mentioned" | "default";

export type BusinessProfile = {
  idea: string;
  industryKey: IndustryKey;
  industryLabel: string;
  angle: string;
  location: string;
  currency: CurrencyCode;
  budget: number;
  budgetProvided: boolean;
  budgetSource?: BudgetSource;
  audience: string;
  experience: ExperienceLevel;
  businessType: BusinessType;
  goals: string;
  locale: Locale;
  pricingTier: PricingTier;
  isIsrael: boolean;
  displayName: string;
  financeReviewed: boolean;
  marketingReviewed: boolean;
};

export type Analysis = {
  mode: "preliminary" | "model";
  disclaimer: string;
  opportunity: string;
  assumptions: string[];
  strengths: string[];
  weaknesses: string[];
  customerProblems: string[];
  differentiation: string;
  revenueModels: { name: string; description: string }[];
  risks: { title: string; detail: string; mitigation: string }[];
};

export type PlanSection = {
  id: string;
  key: PlanKey;
  title: string;
  content: string;
  locked: boolean;
  origin: "preliminary" | "model" | "user";
  position: number;
  updatedAt: string;
};

export type BrandDirection = {
  id: string;
  key: string;
  title: string;
  summary: string;
  names: { name: string; note: string }[];
  chosenName: string;
  tagline: string;
  positioning: string;
  personality: string[];
  voice: string[];
  colors: { name: string; hex: string }[];
  fonts: { heading: string; body: string };
  logo: { style: LogoStyle; initials: string };
  trademarkNote: string;
  generatedImage?: string;
};

export type WebsiteSection = {
  id: string;
  type: SectionType;
  visible: boolean;
  content: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    body?: string;
    button?: string;
    image?: "none" | "wash" | "grid" | "custom";
    imageUrl?: string;
    items?: { title: string; text: string; meta?: string }[];
  };
};

export type WebsiteDoc = {
  basedOnBrandId: string;
  touched: boolean;
  theme: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    headingFont: string;
    bodyFont: string;
  };
  sections: WebsiteSection[];
};

export type FinanceScenario = {
  id: string;
  key: "conservative" | "base" | "optimistic";
  name: string;
  assumptions: Assumptions;
  updatedAt: string;
};

export type MarketingAsset = {
  id: string;
  kind: string;
  title: string;
  content: string;
  position: number;
  updatedAt: string;
};

export type CalendarItem = {
  id: string;
  day: number;
  channel: string;
  concept: string;
  caption: string;
};

export type RoadTask = {
  id: string;
  phase: PhaseKey;
  title: string;
  notes: string;
  priority: "low" | "medium" | "high";
  done: boolean;
  dependsOn: string | null;
  position: number;
  updatedAt: string;
};

export type NotificationItem = {
  id: string;
  projectId: string | null;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  idea: string;
  location: string;
  currency: CurrencyCode;
  budget: number;
  generationMode: "preliminary" | "model";
  updatedAt: string;
  progress: number;
  nextHref: string;
  nextLabel: string;
};

export type ProjectBundle = {
  id: string;
  userId: string;
  name: string;
  idea: string;
  profile: BusinessProfile;
  generationMode: "preliminary" | "model";
  createdAt: string;
  updatedAt: string;
  analysis: Analysis;
  plan: PlanSection[];
  brands: BrandDirection[];
  selectedBrandId: string | null;
  website: WebsiteDoc;
  scenarios: FinanceScenario[];
  marketing: MarketingAsset[];
  calendar: CalendarItem[];
  tasks: RoadTask[];
  shareToken: string | null;
  shareRevoked: boolean;
};

export type GeneratedWorkspace = {
  analysis: Analysis;
  plan: { key: PlanKey; title: string; content: string }[];
  brands: BrandDirection[];
  website: WebsiteDoc;
  scenarios: { key: FinanceScenario["key"]; name: string; assumptions: Assumptions }[];
  marketing: { kind: string; title: string; content: string }[];
  calendar: Omit<CalendarItem, "id">[];
  tasks: {
    phase: PhaseKey;
    title: string;
    notes: string;
    priority: RoadTask["priority"];
    dependsOnIndex: number | null;
  }[];
};

export type BusinessInput = {
  idea: string;
  industryKey: IndustryKey;
  location: string;
  currency: CurrencyCode;
  budget: number | null;
  audience: string;
  experience: ExperienceLevel;
  businessType: BusinessType;
  goals: string;
  locale: Locale;
};
