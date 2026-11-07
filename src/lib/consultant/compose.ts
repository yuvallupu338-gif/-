import type {
  Analysis,
  Assumptions,
  BrandDirection,
  BusinessProfile,
  GeneratedWorkspace,
  LogoStyle,
  PlanKey,
  WebsiteDoc,
  WebsiteSection,
} from "@/lib/domain";
import { allocate } from "@/lib/finance";
import { uid } from "@/lib/utils";
import { getPack, type Pack } from "@/lib/consultant/packs";
import {
  budgetOrigin,
  businessTypeLabel,
  experienceLabel,
  fromIls,
  hashText,
  initials,
  pickRotated,
  text,
  tierLabel,
} from "@/lib/consultant/shared";

const PLAN_TITLES: Record<PlanKey, [string, string]> = {
  executive: ["תקציר", "Executive summary"],
  problem: ["בעיה והצעה", "Problem and offer"],
  audience: ["קהל", "Audience"],
  market: ["מחקר שוק לבדיקה", "Market research to run"],
  competitors: ["קטגוריות תחרות", "Competitive categories"],
  revenue: ["הכנסה", "Revenue"],
  operations: ["תפעול", "Operations"],
  marketing: ["שיווק", "Marketing"],
  financials: ["הנחות פיננסיות", "Financial assumptions"],
  risks: ["סיכונים", "Risks"],
  milestones: ["אבני דרך", "Milestones"],
};

function place(profile: BusinessProfile) {
  if (profile.location) return profile.location;
  return text(profile.locale, "שוק שטרם הוגדר", "a market that is not defined yet");
}

function audience(profile: BusinessProfile) {
  if (profile.audience) return profile.audience;
  return text(profile.locale, "קהל שטרם תואר", "an audience that is not described yet");
}

function moneyNote(profile: BusinessProfile) {
  const origin = budgetOrigin(profile);
  const amount = `${profile.budget} ${profile.currency}`;
  return text(
    profile.locale,
    origin === "entered"
      ? `התקציב שהוזן: ${amount}.`
      : origin === "mentioned"
        ? `שדה התקציב נשאר ריק. הסכום ${amount} נקרא מתיאור הרעיון, והוא הערכה עד שתאשרו אותו בשדה.`
        : `לא הוזן תקציב. סכום הפתיחה במודל (${amount}) הוא הערכה לעריכה.`,
    origin === "entered"
      ? `Entered budget: ${amount}.`
      : origin === "mentioned"
        ? `The budget field was left empty. ${amount} was read from the idea and stays an estimate until you confirm it in the field.`
        : `No budget was entered. The opening amount in the model (${amount}) is an estimate to edit.`,
  );
}

function goals(profile: BusinessProfile) {
  if (profile.goals) return profile.goals;
  return text(
    profile.locale,
    "לא נוסחה מטרה. לפני השקה כדאי לקבוע יעד אחד ל-90 יום, למשל מספר מכירות או שיחות.",
    "No goal was written. Before launch, set one 90-day target, such as a number of sales or conversations.",
  );
}

export function buildAnalysis(profile: BusinessProfile, pack: Pack): Analysis {
  const he = profile.locale === "he";
  return {
    mode: "preliminary",
    disclaimer: text(
      profile.locale,
      "ניתוח ראשוני. לא הורץ מודל שפה ולא בוצע מחקר שוק חי. אין כאן נתוני שוק, נתח שוק או הבטחת רווח. כל סעיף הוא השערה שאפשר לערוך.",
      "Preliminary analysis. No language model ran and no live market research was done. There are no market statistics, share figures, or profit promises. Every point is an assumption you can edit.",
    ),
    opportunity: he
      ? `${profile.displayName} מתחיל מהרעיון: «${profile.idea}». ההזדמנות הראשונה אינה «לכבוש קטגוריה» אלא לבדוק אם ${audience(profile)} ב${place(profile)} מוכנים לשלם על ${pack.offer}. סוג הפעילות: ${businessTypeLabel(profile.businessType, profile.locale)}. רמת הניסיון: ${experienceLabel(profile.experience, profile.locale)}. ${moneyNote(profile)}`
      : `${profile.displayName} starts from this idea: “${profile.idea}”. The first opportunity is not to “own a category”. It is to learn whether ${audience(profile)} in ${place(profile)} will pay for ${pack.offer}. Activity type: ${businessTypeLabel(profile.businessType, profile.locale)}. Experience: ${experienceLabel(profile.experience, profile.locale)}. ${moneyNote(profile)}`,
    assumptions: [
      he ? `הקהל שתואר אכן קונה בקטגוריה הזו, או קרוב אליה: ${audience(profile)}.` : `The described audience already buys in or near this category: ${audience(profile)}.`,
      he ? `מיקום ההשקה הראשון הוא ${place(profile)}.` : `The first launch place is ${place(profile)}.`,
      he ? `רמת המחיר שנגזרה מהניסוח היא ${tierLabel(profile.pricingTier, profile.locale)}. זו קריאה של המילים, לא בדיקת שוק.` : `The price level read from the wording is ${tierLabel(profile.pricingTier, profile.locale)}. That is a reading of the words, not market proof.`,
      moneyNote(profile),
      he ? `יחידת ההכנסה במודל: ${pack.unit}.` : `The revenue unit in the model: ${pack.unit}.`,
    ],
    strengths: pack.strengths,
    weaknesses: pack.weaknesses,
    customerProblems: pack.problems,
    differentiation: he
      ? `הבחנה אפשרית, לבדיקה: להתמקד ב${pack.offer} עבור ${audience(profile)}, עם הבטחה צרה שאפשר לקיים בתקציב הנתון. הבחנה אינה קיימת כי נכתבה כאן. היא קיימת רק אם הלקוח בוחר בכם מול חלופה שהוא כבר מכיר.`
      : `A differentiation to test: focus on ${pack.offer} for ${audience(profile)}, with a narrow promise you can keep inside the budget. It is not real because it was written here. It is real only if a buyer picks you over an alternative they already know.`,
    revenueModels: pack.revenue,
    risks: pack.risks,
  };
}

function sectionBody(key: PlanKey, profile: BusinessProfile, pack: Pack, brandName: string) {
  const he = profile.locale === "he";
  const where = place(profile);
  const who = audience(profile);
  const blocks: Record<PlanKey, string> = {
    executive: he
      ? `# ${profile.displayName}\n\n${profile.displayName} הוא מיזם בשלב הקמה בתחום ${profile.industryLabel}.\n\nהרעיון כפי שנמסר: «${profile.idea}».\n\nהשקה ראשונה סביב ${where}, לקהל: ${who}. ${moneyNote(profile)} סוג הפעילות: ${businessTypeLabel(profile.businessType, profile.locale)}. ניסיון: ${experienceLabel(profile.experience, profile.locale)}.\n\nהמטרה: ${goals(profile)}\n\nשם העבודה למותג, עד שתבחרו כיוון: ${brandName}.\n\nהמסמך הזה הוא תוכנית עבודה ראשונית. הוא לא מחקר מאומת ולא תחזית רווח.`
      : `# ${profile.displayName}\n\n${profile.displayName} is an early-stage ${profile.industryLabel.toLowerCase()} venture.\n\nThe idea, as submitted: “${profile.idea}”.\n\nFirst launch around ${where}, for: ${who}. ${moneyNote(profile)} Activity: ${businessTypeLabel(profile.businessType, profile.locale)}. Experience: ${experienceLabel(profile.experience, profile.locale)}.\n\nGoal: ${goals(profile)}\n\nWorking brand name until you choose a direction: ${brandName}.\n\nThis document is a working plan. It is not verified research and it is not a profit forecast.`,
    problem: he
      ? `## הבעיה\n\n${pack.problems.map((item) => `- ${item}`).join("\n")}\n\n## ההצעה לבדיקה\n\n${pack.offer}. הקהל: ${who}. המקום: ${where}.\n\nאם הבעיה לא עולה בשיחות עם אנשים אמיתיים, אין טעם להרחיב מיתוג או מלאי.`
      : `## Problem\n\n${pack.problems.map((item) => `- ${item}`).join("\n")}\n\n## Offer to test\n\n${pack.offer}. Audience: ${who}. Place: ${where}.\n\nIf the problem does not show up in conversations with real people, do not expand the brand or the inventory.`,
    audience: he
      ? `התיאור שהוזן: ${who}.\n\nכדאי לפצל לשיחה, לא לפרסונה מומצאת:\n\n- מי מחליט על הקנייה\n- באיזה רגע עולה הצורך\n- מה הם קונים היום במקום זה\n- מה היה גורם להם לא לקנות\n\nאל תכתבו גיל ו«אוהב איכות» בלי ציטוט משיחה. אחרי שמונה שיחות, עדכנו את הסעיף הזה במילים שלהם.`
      : `What you entered: ${who}.\n\nSplit this into a conversation, not an invented persona:\n\n- Who decides to buy\n- When the need shows up\n- What they buy instead today\n- What would stop them\n\nDo not write an age and “loves quality” without a quote. After eight conversations, rewrite this section in their words.`,
    market: he
      ? `לא בוצע מחקר שוק. אין במסמך גודל שוק, קצב צמיחה או נתח.\n\nסדר בדיקה ל${profile.industryLabel} ב${where}:\n\n- לרשום את המקומות שבהם ${who} כבר קונים\n- לאסוף 10 מחירי מדף אמיתיים, עם תאריך\n- לזהות מה כלול במחיר: משלוח, החזרה, שירות, מנוי\n- להבדיל בין עניין בשיחה לבין תשלום\n\n${profile.isIsrael ? "אם ההשקה בישראל, לבדוק גם שפה, מע״מ, משלוח בתוך הארץ ואמצעי תשלום מקומיים. את שיעור המע״מ יש לאמת מול רואה חשבון." : "אם ההשקה מחוץ לישראל, להחליף את הנחות המטבע והמס לפי המדינה."}`
      : `No market research was run. This document has no market size, growth rate, or share.\n\nA check for ${profile.industryLabel} in ${where}:\n\n- List where ${who} already buy\n- Collect 10 real shelf prices, with dates\n- Note what the price includes: shipping, returns, service, subscription\n- Separate interest in a conversation from payment\n\n${profile.isIsrael ? "If you launch in Israel, also check language, VAT, domestic shipping, and local payments. Confirm the current VAT rate with an accountant." : "If you launch outside Israel, replace the currency and tax assumptions for that country."}`,
    competitors: he
      ? `אין כאן רשימת מתחרים מאומתת ואין נתונים עליהם.\n\nקטגוריות לבדיקה:\n\n${pack.competitorCategories.map((item) => `- ${item}`).join("\n")}\n\nלכל גורם שתמצאו, לרשום רק מה שאפשר לראות: מחיר, הבטחה, תנאי אספקה, ומה חסר. לא להעריך להם נתח שוק.`
      : `There is no verified competitor list and no data about them.\n\nCategories to research:\n\n${pack.competitorCategories.map((item) => `- ${item}`).join("\n")}\n\nFor each name you actually find, record only what you can see: price, promise, delivery terms, and what is missing. Do not estimate their market share.`,
    revenue: he
      ? pack.revenue.map((item) => `## ${item.name}\n\n${item.description}`).join("\n\n") +
        `\n\nהמודל בפיננסים משתמש ביחידה «${pack.unit}». אם תבחרו מודל אחר, עדכנו את המחיר ואת מספר היחידות שם. בחירה במודל אינה מוכיחה שהוא עובד.`
      : pack.revenue.map((item) => `## ${item.name}\n\n${item.description}`).join("\n\n") +
        `\n\nThe finance model uses the unit “${pack.unit}”. If you choose another model, change the price and the unit count there. Choosing a model does not prove it works.`,
    operations: he
      ? `${pack.operations.map((item) => `- ${item}`).join("\n")}\n\nהיקף ראשון שמתאים לתקציב שהוזן: לקיים את ההצעה בקנה מידה שאפשר לשרת בלי צוות. ${profile.experience === "first" ? "במיזם ראשון, תעדו כל שלב. אל תבנו תהליך לצוות שעדיין אין." : "נצלו ניסיון קיים כדי לקצר את הבדיקה, לא כדי לדלג עליה."}`
      : `${pack.operations.map((item) => `- ${item}`).join("\n")}\n\nA first scope that fits the entered budget: deliver the offer at a size you can serve without a team. ${profile.experience === "first" ? "On a first venture, write every step down. Do not design a process for a team you do not have." : "Use existing experience to shorten the test, not to skip it."}`,
    marketing: he
      ? `ערוצים שמתאימים לשלב הזה, לא לרשימת כל הרשתות:\n\n${pack.channels.map((item) => `- ${item}`).join("\n")}\n\n${profile.isIsrael ? "בישראל כדאי לכתוב בעברית טבעית, לבדוק וואטסאפ וקהילות מקומיות, ולא להניח שאנגלית מחליפה הסבר." : "Write in the language your buyers use."}\n\nהשם ${brandName} הוא הצעת עבודה. הוא לא נבדק כסימן מסחר.\n\nיעד שיווקי ראשון: שיחות או הזמנות שקשורות למטרה שכתבתם, לא חשיפות.`
      : `Channels that fit this stage, not a list of every network:\n\n${pack.channels.map((item) => `- ${item}`).join("\n")}\n\n${profile.isIsrael ? "In Israel, write natural Hebrew and check WhatsApp and local communities. Do not assume English replaces an explanation." : "Write in the language your buyers use."}\n\nThe name ${brandName} is a working suggestion. It has not been cleared as a trademark.\n\nThe first marketing target is conversations or orders tied to the goal you wrote, not impressions.`,
    financials: he
      ? `${moneyNote(profile)}\n\nפיצול עלויות ההקמה במודל הוא הערכה שמסתכמת לתקציב. ההוצאות החודשיות, המחיר, עלות המכר ומספר הלקוחות הם הערכות נפרדות לפי סוג העסק ורמת המחיר. הן מסומנות בסטודיו הפיננסי כהערכה, לא כנתון שהוזן.\n\nיחידה: ${pack.unit}. מחיר פתיחה במודל הבסיס נגזר מרמת «${tierLabel(profile.pricingTier, profile.locale)}».\n\nשכר מייסדים עומד על אפס עד שתשנו אותו. נקודת איזון מחושבת מההנחות, והיא לא תחזית.\n\n${profile.isIsrael ? "לפני מחיר ללקוח, לבדוק מול רואה חשבון מע״מ, ביטוח לאומי ודיווח. אל תניחו ששיעור מס נשאר קבוע." : "Confirm tax treatment with an accountant before publishing a customer price."}`
      : `${moneyNote(profile)}\n\nThe startup split in the model is an estimate that adds up to the budget. Monthly costs, price, cost of goods, and customer count are separate estimates from the business type and price level. The finance studio marks them as estimates, not as figures you entered.\n\nUnit: ${pack.unit}. The opening base price comes from the “${tierLabel(profile.pricingTier, profile.locale)}” reading.\n\nFounder pay stays at zero until you change it. Break-even is calculated from the assumptions. It is not a forecast.\n\n${profile.isIsrael ? "Before a customer price, confirm VAT, national insurance, and reporting with an accountant. Do not assume a tax rate stays fixed." : "Confirm tax treatment with an accountant before publishing a customer price."}`,
    risks: he
      ? pack.risks.map((risk) => `## ${risk.title}\n\n${risk.detail}\n\nצעד מקדים: ${risk.mitigation}`).join("\n\n") +
        `\n\nאף צעד כאן לא מבטיח שהסיכון נעלם.`
      : pack.risks.map((risk) => `## ${risk.title}\n\n${risk.detail}\n\nA preceding step: ${risk.mitigation}`).join("\n\n") +
        `\n\nNone of these steps guarantees the risk goes away.`,
    milestones: he
      ? `1. שמונה שיחות עם ${who} ב${where}.\n2. מחיר אחד ועלות יחידה אחת כתובים.\n3. בחירת כיוון מותג ובדיקת שם במרשם ובדומיין. השם ${brandName} הוא רק נקודת התחלה.\n4. עמוד הצעה אחד, לא אתר שלם.\n5. מכירה שקטה לקבוצה קטנה.\n6. החלטה לפי המטרה: ${goals(profile)}\n\nאם שלב נכשל, עוצרים או משנים את ההצעה. לא ממשיכים אוטומטית לשיווק רחב.`
      : `1. Eight conversations with ${who} in ${where}.\n2. One price and one unit cost, written down.\n3. Choose a brand direction and check the name in the register and as a domain. ${brandName} is only a starting point.\n4. One offer page, not a complete site.\n5. A quiet sale to a small group.\n6. A decision against the goal: ${goals(profile)}\n\nIf a step fails, stop or change the offer. Do not continue automatically into broad marketing.`,
  };
  return blocks[key];
}

export function buildPlan(profile: BusinessProfile, pack: Pack, brandName: string) {
  return (Object.keys(PLAN_TITLES) as PlanKey[]).map((key) => ({
    key,
    title: text(profile.locale, PLAN_TITLES[key][0], PLAN_TITLES[key][1]),
    content: sectionBody(key, profile, pack, brandName),
  }));
}

const DIRECTIONS: { key: string; he: string; en: string; summaryHe: string; summaryEn: string; style: LogoStyle; fonts: { heading: string; body: string } }[] = [
  {
    key: "editorial",
    he: "שקט ועריכתי",
    en: "Quiet editorial",
    summaryHe: "מעט מילים, חומר ושימוש. מתאים למחיר שלא צריך לצעוק.",
    summaryEn: "Few words, material, and use. Fits a price that does not need to shout.",
    style: "wordmark",
    fonts: { heading: "Frank Ruhl Libre", body: "Heebo" },
  },
  {
    key: "direct",
    he: "ישיר וברור",
    en: "Direct and plain",
    summaryHe: "שם שמסביר מה קונים. פחות אווירה, יותר החלטה.",
    summaryEn: "A name that explains what is being bought. Less atmosphere, faster decision.",
    style: "seal",
    fonts: { heading: "Heebo", body: "Heebo" },
  },
  {
    key: "local",
    he: "חם ומקומי",
    en: "Warm and local",
    summaryHe: "קשור למקום ולהיכרות. מתאים להשקה בקבוצה קטנה.",
    summaryEn: "Tied to place and familiarity. Fits a launch to a small group.",
    style: "monogram",
    fonts: { heading: "Rubik", body: "Assistant" },
  },
];

function trademark(locale: BusinessProfile["locale"]) {
  return text(
    locale,
    "השמות האלה לא נבדקו במרשם סימני המסחר, בדומיין או ברשתות. אין כאן אישור משפטי לשימוש.",
    "These names were not checked in a trademark register, as domains, or on social networks. This is not legal clearance to use them.",
  );
}

export function buildBrands(profile: BusinessProfile, pack: Pack, salt = 0): BrandDirection[] {
  const start = hashText(`${profile.idea}:${salt}`) % pack.names.length;
  const names = pickRotated(pack.names, start, Math.min(6, pack.names.length));
  return DIRECTIONS.map((direction, index) => {
    const chosen = names[index % names.length];
    const second = names[(index + 3) % names.length];
    const palette = pack.palettes[index % pack.palettes.length];
    const accent = palette[2]?.hex ?? "#171917";
    return {
      id: uid(),
      key: direction.key,
      title: text(profile.locale, direction.he, direction.en),
      summary: text(profile.locale, direction.summaryHe, direction.summaryEn),
      names: [chosen, second],
      chosenName: chosen.name,
      tagline: text(
        profile.locale,
        `${pack.offer} · ${place(profile)}`,
        `${pack.offer} · ${place(profile)}`,
      ),
      positioning: text(
        profile.locale,
        `${chosen.name} פונה אל ${audience(profile)} עם ${pack.offer}. המיקום הראשון: ${place(profile)}. רמת המחיר לקריאה: ${tierLabel(profile.pricingTier, profile.locale)}. הכיוון «${text(profile.locale, direction.he, direction.en)}» מתאר טון, לא הבטחה שהמותג כבר נתפס כך.`,
        `${chosen.name} speaks to ${audience(profile)} with ${pack.offer}. First place: ${place(profile)}. Price reading: ${tierLabel(profile.pricingTier, profile.locale)}. The direction “${direction.en}” describes a tone, not a claim that the brand is already perceived that way.`,
      ),
      personality: text(
        profile.locale,
        ["מדויק", "שקט", "עקבי", "לא מתנצל על מחיר"].join("|"),
        ["precise", "quiet", "consistent", "unapologetic about price"].join("|"),
      )
        .split("|")
        .map((item, traitIndex) => (index === 1 && traitIndex === 1 ? text(profile.locale, "ישיר", "direct") : item)),
      voice: [
        text(profile.locale, "משפט קצר על מה שקונים", "A short sentence about what is bought"),
        text(profile.locale, "בלי הבטחת תוצאה שלא נמדדה", "No result claim you have not measured"),
        text(profile.locale, "מילים שהלקוח השתמש בהן בשיחה", "Words the buyer used in conversation"),
        text(profile.locale, accent ? "מספרים רק כשיש מקור" : "מספרים רק כשיש מקור", "Numbers only with a source"),
      ],
      colors: palette,
      fonts: direction.fonts,
      logo: { style: direction.style, initials: initials(chosen.name) },
      trademarkNote: trademark(profile.locale),
    };
  });
}

export function extraNames(profile: BusinessProfile, salt: number) {
  const pack = getPack(profile.industryKey, profile.locale, profile.angle);
  const start = hashText(`${profile.idea}:${salt}:more`) % pack.names.length;
  return pickRotated(pack.names, start, 3);
}

function items(rows: [string, string, string?][]) {
  return rows.map(([title, textValue, meta]) => ({ title, text: textValue, meta }));
}

export function websiteFromBrand(profile: BusinessProfile, brand: BrandDirection): WebsiteDoc {
  const he = profile.locale === "he";
  const pack = getPack(profile.industryKey, profile.locale, profile.angle);
  const ink = brand.colors[1]?.hex ?? "#171917";
  const paper = brand.colors[0]?.hex ?? "#F7F4EE";
  const accent = brand.colors[2]?.hex ?? "#171917";
  const surface = brand.colors[3]?.hex ?? "#FFFFFF";
  const sections: WebsiteSection[] = [
    {
      id: uid(),
      type: "nav",
      visible: true,
      content: {
        title: brand.chosenName,
        items: items([
          [he ? "הצעה" : "Offer", "about"],
          [he ? "עבודה" : "Work", "products"],
          [he ? "מחיר" : "Price", "pricing"],
          [he ? "שאלות" : "Questions", "faq"],
        ]),
      },
    },
    {
      id: uid(),
      type: "hero",
      visible: true,
      content: {
        eyebrow: profile.location || profile.industryLabel,
        title: brand.chosenName,
        subtitle: brand.tagline,
        body: he
          ? `${brand.positioning} זה עמוד טיוטה, לא השקה.`
          : `${brand.positioning} This is a draft page, not a launch.`,
        button: he ? "לשיחה ראשונה" : "Request a first conversation",
        image: "wash",
      },
    },
    {
      id: uid(),
      type: "about",
      visible: true,
      content: {
        eyebrow: he ? "למה זה קיים" : "Why this exists",
        title: he ? "הצעה אחת, לפני שהיא גדלה" : "One offer, before it grows",
        body: he
          ? `העסק נבנה סביב הרעיון: «${profile.idea}». הקהל הראשון: ${audience(profile)}. אין כאן טענה שהשוק הוכח.`
          : `The business is built around this idea: “${profile.idea}”. First audience: ${audience(profile)}. This page does not claim the market is proven.`,
      },
    },
    {
      id: uid(),
      type: "products",
      visible: true,
      content: {
        title: he ? "מה אפשר לקנות בשלב הראשון" : "What can be bought first",
        items: items([
          [pack.revenue[0]?.name ?? (he ? "הצעה" : "Offer"), pack.revenue[0]?.description ?? pack.offer, he ? "שלב בדיקה" : "Test stage"],
          [pack.revenue[1]?.name ?? (he ? "חלופה" : "Alternative"), pack.revenue[1]?.description ?? pack.offer, he ? "לפי קיבולת" : "By capacity"],
          [he ? "שיחת התאמה" : "Fit conversation", he ? "עשרים דקות כדי לבדוק אם ההצעה נכונה, בלי מצגת." : "Twenty minutes to see if the offer fits, without a deck.", ""],
        ]),
      },
    },
    {
      id: uid(),
      type: "pricing",
      visible: true,
      content: {
        title: he ? "מחיר פתיחה לעריכה" : "Opening price to edit",
        subtitle: he ? "המספרים מגיעים מההנחות בסטודיו הפיננסי. הם לא מחירון מאושר." : "Figures come from the finance assumptions. They are not an approved price list.",
        items: items([
          [he ? "בדיקה" : "Test", he ? "היקף קטן עם מחיר כתוב מראש." : "A small scope with the price written first.", he ? "לפי המודל" : "From the model"],
          [he ? "הצעה מלאה" : "Full offer", pack.offer, he ? "אחרי שיש קונה" : "After a buyer exists"],
        ]),
      },
    },
    {
      id: uid(),
      type: "features",
      visible: true,
      content: {
        title: he ? "מה כלול, ומה לא" : "What is included, and what is not",
        items: items(pack.operations.slice(0, 3).map((item) => [item, he ? "כלול בשלב הראשון רק אם סימנתם אותו במפת הדרכים." : "Included in stage one only if you marked it on the roadmap."])),
      },
    },
    {
      id: uid(),
      type: "faq",
      visible: true,
      content: {
        title: he ? "שאלות לפני שמשלמים" : "Questions before paying",
        items: items([
          [he ? "האם השם פנוי?" : "Is the name available?", brand.trademarkNote],
          [he ? "האם יש התחייבות לרווח?" : "Is profit guaranteed?", he ? "לא. העמוד והמספרים הם תכנון, לא תוצאה." : "No. The page and the numbers are planning, not a result."],
          [he ? "איפה מתחילים?" : "Where does it start?", `${place(profile)}. ${audience(profile)}.`],
        ]),
      },
    },
    {
      id: uid(),
      type: "contact",
      visible: true,
      content: {
        title: he ? "שיחה, לא רשימת תפוצה" : "A conversation, not a list",
        body: he ? "השאירו דרך חזרה. אין כאן טפסים שמחוברים לשרת חיצוני בטיוטה הזו." : "Leave a way back. This draft is not wired to an external form service.",
        button: "hello@example.com",
      },
    },
    {
      id: uid(),
      type: "footer",
      visible: true,
      content: {
        title: brand.chosenName,
        body: he ? `${profile.industryLabel}. טיוטה שנבנתה ב-LaunchLab. לא אתר שפורסם.` : `${profile.industryLabel}. A LaunchLab draft. Not a published site.`,
      },
    },
  ];
  return {
    basedOnBrandId: brand.id,
    touched: false,
    theme: {
      background: paper,
      surface,
      text: ink,
      muted: "#5E655C",
      accent,
      accentText: "#171917",
      headingFont: brand.fonts.heading,
      bodyFont: brand.fonts.body,
    },
    sections,
  };
}

function assumptionsFor(profile: BusinessProfile, pack: Pack, kind: "conservative" | "base" | "optimistic"): Assumptions {
  const price = fromIls(pack.price[profile.pricingTier], profile.currency);
  const customers = pack.customers[profile.pricingTier];
  const growth = kind === "conservative" ? 0.03 : kind === "optimistic" ? 0.12 : 0.07;
  const starting = kind === "conservative" ? Math.max(1, Math.round(customers * 0.55)) : kind === "optimistic" ? Math.round(customers * 1.45) : customers;
  const adjustedPrice = kind === "optimistic" ? Math.round(price * 1.05) : price;
  return {
    startupItems: allocate(profile.budget, pack.startupNames.map((name, index) => ({ name, ratio: pack.startupRatios[index] ?? 0 }))),
    monthlyItems: pack.monthly.map((item, index) => ({
      id: `monthly-${index}`,
      name: item.name,
      amount: fromIls(item.amountIls, profile.currency),
      source: "estimate" as const,
    })),
    price: adjustedPrice,
    cogsRatio: pack.cogs,
    startingCustomers: starting,
    monthlyGrowth: growth,
    horizon: 12,
    openingCash: profile.budget,
    openingCashSource: budgetOrigin(profile) === "entered" ? "input" : "estimate",
    notes: text(
      profile.locale,
      `תרחיש ${kind === "base" ? "בסיס" : kind === "conservative" ? "שמרני" : "אופטימי"}. יחידה: ${pack.unit}. מחיר, עלות מכר, לקוחות והוצאה חודשית הם הערכות. ${budgetOrigin(profile) === "entered" ? "תקציב הפתיחה הוזן על ידכם." : budgetOrigin(profile) === "mentioned" ? "תקציב הפתיחה נקרא מהתיאור ויש לאשר אותו." : "תקציב הפתיחה הוא ברירת מחדל לעריכה."} שער המרה משוער מש״ח משמש רק כשבוחרים מטבע אחר, והוא לא שער שוק.`,
      `${kind} scenario. Unit: ${pack.unit}. Price, cost ratio, customers, and monthly cost are estimates. ${budgetOrigin(profile) === "entered" ? "Opening budget was entered by you." : budgetOrigin(profile) === "mentioned" ? "Opening budget was read from the description and should be confirmed." : "Opening budget is a default to edit."} A rough shekel conversion is used only when another currency is selected. It is not a market rate.`,
    ),
  };
}

function marketing(profile: BusinessProfile, pack: Pack, brand: BrandDirection) {
  const he = profile.locale === "he";
  const name = brand.chosenName;
  const assets = [
    {
      kind: "campaign",
      title: he ? "קמפיין השקה" : "Launch campaign",
      content: he
        ? `שם עבודה: ${name}\nהצעה: ${pack.offer}\nקהל: ${audience(profile)}\nמקום: ${place(profile)}\n\nמסר אחד: מה קונים, למי, ואיפה מתחילים.\nלא לפרסם לפני שיש מחיר, תנאי אספקה ודרך לשלם.\nמדד: שיחות או הזמנות, לא חשיפות.\n${brand.trademarkNote}`
        : `Working name: ${name}\nOffer: ${pack.offer}\nAudience: ${audience(profile)}\nPlace: ${place(profile)}\n\nOne message: what is bought, for whom, and where it starts.\nDo not promote before there is a price, a delivery term, and a way to pay.\nMeasure conversations or orders, not impressions.\n${brand.trademarkNote}`,
    },
    {
      kind: "instagram",
      title: he ? "אינסטגרם" : "Instagram",
      content: he
        ? `פוסט 1. הבעיה, בלי שם המותג בשורה הראשונה.\n«${pack.problems[0]}»\n\nפוסט 2. החומר או התהליך.\n${pack.operations[0]}\n\nפוסט 3. הזמנה לקבוצה קטנה ב${place(profile)}.\n${name} · ${brand.tagline}`
        : `Post 1. The problem, without the brand name in the first line.\n“${pack.problems[0]}”\n\nPost 2. The material or the process.\n${pack.operations[0]}\n\nPost 3. An invitation to a small group in ${place(profile)}.\n${name} · ${brand.tagline}`,
    },
    {
      kind: "tiktok",
      title: he ? "טיקטוק" : "TikTok",
      content: he
        ? `רעיון 1. 20 שניות: להראות את ההחלטה ש${audience(profile)} עושים היום, ואז את החלופה של ${name}. בלי מוזיקה שמכסה את ההסבר.\nרעיון 2. לענות על התנגדות אחת: מחיר, מידה, זמן או אמון. משפט אחרון: איך מצטרפים לקבוצת הניסיון.`
        : `Idea 1. 20 seconds: show the decision ${audience(profile)} make today, then the alternative from ${name}. Do not cover the explanation with music.\nIdea 2. Answer one objection: price, fit, time, or trust. Last line: how to join the trial group.`,
    },
    {
      kind: "email",
      title: he ? "דוא״ל" : "Email",
      content: he
        ? `נושא: ${name}, קבוצה ראשונה ב${place(profile)}\n\nשלום,\nאני פותח את ${profile.industryLabel} בקנה מידה קטן. ההצעה: ${pack.offer}.\nאם זה רלוונטי ל${audience(profile)}, אפשר לענות למייל הזה. אין רשימת תפוצה ואין הבטחת תוצאה.\n${goals(profile)}`
        : `Subject: ${name}, first group in ${place(profile)}\n\nHello,\nI am opening ${profile.industryLabel} at a small scale. The offer: ${pack.offer}.\nIf this is relevant for ${audience(profile)}, reply to this email. There is no list and no promised result.\n${goals(profile)}`,
    },
    {
      kind: "ads",
      title: he ? "מודעות" : "Ads",
      content: he
        ? `לא להדליק תקציב מדיה לפני שמכירה שקטה עבדה.\nאם בודקים מודעה: קהל צר סביב ${place(profile)}, טקסט אחד, דף אחד, ומדד של פניות.\nתקציב בדיקה מוצע כהערכה נמצא בשורת התוכן במודל הפיננסי. לערוך אותו שם.`
        : `Do not turn on media spend before a quiet sale has worked.\nIf you test an ad: a narrow audience around ${place(profile)}, one text, one page, and enquiries as the measure.\nA suggested test budget sits in the finance model as an estimate. Edit it there.`,
    },
    {
      kind: "seo",
      title: he ? "חיפוש" : "Search",
      content: he
        ? `עמוד אחד שעונה על כוונה ברורה, בעברית אם הלקוח מחפש בעברית.\nנושאים לבדיקה, לא דירוג מובטח:\n- ${profile.industryLabel} ב${place(profile)}\n- ${pack.offer}\n- מחיר, אספקה, למי זה לא מתאים\n\nלא להמציא שאלות נפוצות. לכתוב שאלות ששמעתם.`
        : `One page that answers a clear intent, in the language people search in.\nTopics to test, not a ranking promise:\n- ${profile.industryLabel} in ${place(profile)}\n- ${pack.offer}\n- Price, delivery, and who it is not for\n\nDo not invent frequent questions. Write questions you heard.`,
    },
    {
      kind: "acquisition",
      title: he ? "השגת לקוחות" : "Customer acquisition",
      content: he
        ? `1. רשימה של 30 שמות שמכירים את ${audience(profile)}.\n2. עשרה מהם מקבלים הודעה אישית, לא שבלונה.\n3. חמישה נפגשים או מנסים.\n4. שניים משלמים, או שאף אחד לא משלם וחוזרים להצעה.\n\nערוצים מתוך התוכנית:\n${pack.channels.map((item) => `- ${item}`).join("\n")}`
        : `1. A list of 30 names who know ${audience(profile)}.\n2. Ten of them get a personal note, not a template.\n3. Five meet or try.\n4. Two pay, or nobody pays and you return to the offer.\n\nChannels from the plan:\n${pack.channels.map((item) => `- ${item}`).join("\n")}`,
    },
  ];
  const beats = he
    ? [
        ["הבעיה", "לכתוב את הבעיה במשפט של לקוח, בלי שם המותג."],
        ["חומר או תהליך", "להראות איך ההצעה נעשית."],
        ["התנגדות", "לענות על מחיר, זמן או אמון."],
        ["הוכחה", "ציטוט משיחה, רק אם יש אישור לפרסם."],
        ["הזמנה", `קבוצה ראשונה ב${place(profile)}.`],
      ]
    : [
        ["The problem", "Write the problem in a buyer's sentence, without the brand name."],
        ["Material or process", "Show how the offer is made."],
        ["Objection", "Answer price, time, or trust."],
        ["Proof", "A quote from a conversation, only with permission to publish."],
        ["Invitation", `First group in ${place(profile)}.`],
      ];
  const channels = ["Instagram", "TikTok", "Email", "Community", "Search"];
  const calendar = Array.from({ length: 30 }, (_, index) => {
    const beat = beats[index % beats.length];
    const channel = channels[index % channels.length];
    return {
      day: index + 1,
      channel,
      concept: `${name}: ${beat[0]}`,
      caption: `${beat[1]} ${brand.tagline}`,
    };
  });
  return { assets, calendar };
}

function tasks(profile: BusinessProfile, pack: Pack, brandName: string) {
  const he = profile.locale === "he";
  const who = audience(profile);
  const where = place(profile);
  const rows: [GeneratedWorkspace["tasks"][number]["phase"], string, string, "low" | "medium" | "high", number | null][] = [
    ["validation", he ? `שמונה שיחות עם ${who}` : `Eight conversations with ${who}`, he ? "לרשום ציטוטים, לא סיכום שלכם." : "Write quotes, not your summary.", "high", null],
    ["validation", he ? "בדיקת נכונות לשלם במחיר הפתיחה" : "Test willingness to pay at the opening price", he ? "לבקש מספר, לא «נשמע מעניין»." : "Ask for a number, not “sounds interesting”.", "high", null],
    ["validation", he ? "מיפוי חמש חלופות שהקהל כבר קונה" : "Map five alternatives the audience already buys", pack.competitorCategories.join(", "), "medium", null],
    ["planning", he ? "ניסוח ההצעה במשפט אחד" : "Write the offer in one sentence", pack.offer, "high", 0],
    ["planning", he ? "בחירת ערוץ מכירה ראשון" : "Choose the first sales channel", pack.channels[0] ?? "", "medium", 1],
    ["planning", he ? "תקרת הוצאה חודשית" : "A monthly spending ceiling", he ? "לערוך בסטודיו הפיננסי ולשמור." : "Edit it in the finance studio and save.", "high", 1],
    ["branding", he ? "בחירת כיוון מותג אחד" : "Choose one brand direction", he ? `נקודת התחלה: ${brandName}. ${trademark(profile.locale)}` : `Starting point: ${brandName}. ${trademark(profile.locale)}`, "high", 3],
    ["branding", he ? "בדיקת שם במרשם, בדומיין וברשתות" : "Check the name in the register, domain, and networks", he ? "לא להזמין אריזה לפני הבדיקה." : "Do not order packaging before the check.", "high", 6],
    ["branding", he ? "נעילת צבעים וגופנים לטיוטה" : "Lock colors and fonts for the draft", he ? "אפשר לשנות אחר כך. לא לפתוח כיוון רביעי לפני שיש קונה." : "You can change them later. Do not open a fourth direction before a buyer exists.", "medium", 6],
    ["setup", he ? "שיחה עם רואה חשבון על מבנה, מע״מ ודיווח" : "Talk to an accountant about structure, VAT, and reporting", he ? "זה צעד, לא ייעוץ מתוך המערכת." : "This is a step, not advice from the product.", "high", 4],
    ["setup", he ? "אמצעי תשלום וחשבונית" : "A way to take payment and issue an invoice", he ? "בלי זה אין מכירה, גם אם האתר יפה." : "Without this there is no sale, even if the site is attractive.", "high", 9],
    ["setup", he ? "ספק או נותן שירות ראשון" : "A first supplier or collaborator", pack.operations[0] ?? "", "medium", 5],
    ["website", he ? "טיוטת עמוד לפי הכיוון שנבחר" : "A draft page from the chosen direction", he ? "בסטודיו האתר. לא לפרסם מהטיוטה." : "In the website studio. Do not publish from the draft.", "medium", 6],
    ["website", he ? "מחיר ותנאי אספקה על העמוד" : "Price and delivery terms on the page", he ? "אם אין מספר, אין עמוד מוכן." : "If there is no number, the page is not ready.", "high", 12],
    ["website", he ? "בדיקה ברוחב טלפון" : "Check at phone width", he ? "לקרוא את כל הטקסט בלי לגלול הצידה." : "Read every line without horizontal scrolling.", "medium", 12],
    ["marketing", he ? "עשרה נכסים לפני פרסום" : "Ten assets before promotion", he ? "אפשר לערוך בסטודיו השיווק." : "Edit them in the marketing studio.", "medium", 12],
    ["marketing", he ? `רשימת 30 אנשים סביב ${where}` : `A list of 30 people around ${where}`, he ? "שמות אמיתיים בלבד." : "Real names only.", "high", 0],
    ["marketing", he ? "הצעת השקה מוגבלת בזמן ובכמות" : "A launch offer limited in time and quantity", he ? "המגבלה צריכה להיות אמיתית." : "The limit has to be real.", "medium", 1],
    ["launch", he ? "מכירה שקטה לקבוצה הראשונה" : "A quiet sale to the first group", he ? "לפני מודעות." : "Before ads.", "high", 13],
    ["launch", he ? "איסוף התנגדויות ממי ששילם וממי שסירב" : "Collect objections from people who paid and people who refused", he ? "לעדכן את התוכנית, לא רק את העיצוב." : "Update the plan, not only the design.", "high", 18],
    ["launch", he ? "החלטה: ממשיכים, משנים או עוצרים" : "Decide: continue, change, or stop", goals(profile), "high", 19],
    ["growth", he ? "שינוי ההצעה לפי מה שנמכר" : "Change the offer based on what sold", he ? "לא לפי מה שקיבל לייק." : "Not based on what was liked.", "medium", 20],
    ["growth", he ? "ערוץ שני רק אחרי שהראשון חוזר" : "A second channel only after the first one repeats", pack.channels[1] ?? "", "low", 21],
    ["growth", he ? "מדידה חודשית של מזומן" : "A monthly cash review", he ? "מהסטודיו הפיננסי, מול מה שקרה בפועל." : "From the finance studio, against what actually happened.", "medium", 20],
  ];
  return rows.map(([phase, title, notes, priority, dependsOnIndex]) => ({ phase, title, notes, priority, dependsOnIndex }));
}

export function buildWorkspace(profile: BusinessProfile): GeneratedWorkspace {
  const pack = getPack(profile.industryKey, profile.locale, profile.angle);
  const brands = buildBrands(profile, pack, 0);
  const primary = brands[0];
  const scenarioName = {
    conservative: text(profile.locale, "שמרני", "Conservative"),
    base: text(profile.locale, "בסיס", "Base"),
    optimistic: text(profile.locale, "אופטימי", "Optimistic"),
  } as const;
  const marketingPack = marketing(profile, pack, primary);
  return {
    analysis: buildAnalysis(profile, pack),
    plan: buildPlan(profile, pack, primary.chosenName),
    brands,
    website: websiteFromBrand(profile, primary),
    scenarios: (["conservative", "base", "optimistic"] as const).map((key) => ({
      key,
      name: scenarioName[key],
      assumptions: assumptionsFor(profile, pack, key),
    })),
    marketing: marketingPack.assets,
    calendar: marketingPack.calendar,
    tasks: tasks(profile, pack, primary.chosenName),
  };
}

export function rebuildSection(profile: BusinessProfile, key: PlanKey) {
  const pack = getPack(profile.industryKey, profile.locale, profile.angle);
  const brandName = profile.displayName;
  return {
    title: text(profile.locale, PLAN_TITLES[key][0], PLAN_TITLES[key][1]),
    content: sectionBody(key, profile, pack, brandName),
  };
}

export function rebuildAnalysis(profile: BusinessProfile) {
  return buildAnalysis(profile, getPack(profile.industryKey, profile.locale, profile.angle));
}
