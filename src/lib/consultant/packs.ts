import type { IndustryKey, Locale, PricingTier } from "@/lib/domain";

export type PackCopy = {
  offer: string;
  unit: string;
  problems: string[];
  strengths: string[];
  weaknesses: string[];
  channels: string[];
  operations: string[];
  competitorCategories: string[];
  risks: { title: string; detail: string; mitigation: string }[];
  revenue: { name: string; description: string }[];
  startupNames: string[];
  monthly: { name: string; amountIls: number }[];
  names: { name: string; note: string }[];
};

export type Pack = PackCopy & {
  cogs: number;
  price: Record<PricingTier, number>;
  customers: Record<PricingTier, number>;
  startupRatios: number[];
  palettes: { name: string; hex: string }[][];
};

const RATIO = [0.2, 0.35, 0.1, 0.12, 0.1, 0.13];

const COLOR_EN: Record<string, string> = {
  חול: "Sand",
  דיו: "Ink",
  זית: "Olive",
  נייר: "Paper",
  פחם: "Charcoal",
  אבן: "Stone",
  חרס: "Clay",
  לבן: "White",
  יער: "Forest",
  קרם: "Cream",
  פליז: "Brass",
  ערפל: "Mist",
  בטון: "Concrete",
  "ליים עמוק": "Deep lime",
  לילה: "Night",
  פלדה: "Steel",
  "לבן חם": "Warm white",
  אות: "Signal",
  אדמה: "Earth",
  עלים: "Leaf",
  קפה: "Coffee",
  עגבנייה: "Tomato",
  חלב: "Milk",
  "זהב עמום": "Muted gold",
  חלמון: "Yolk",
  שחור: "Black",
  קו: "Line",
  אפור: "Gray",
  "כחול דיו": "Ink blue",
  נחושת: "Copper",
  שנהב: "Ivory",
  "ירוק ספרייה": "Library green",
  "אדום עמום": "Muted red",
  "כחול לילה": "Night blue",
  כחול: "Blue",
  חום: "Brown",
  "כתום עמום": "Muted orange",
  ירוק: "Green",
  אבקה: "Powder",
  "ורוד עמום": "Muted rose",
  מרווה: "Sage",
  פשתן: "Linen",
  עץ: "Wood",
  ים: "Sea",
  טרקוטה: "Terracotta",
  "אפור חם": "Warm gray",
  "ירוק זית": "Olive green",
  ליים: "Lime",
};

function palette(rows: [string, string][][]): { name: string; hex: string }[][] {
  return rows.map((row) => row.map(([name, hex]) => ({ name, hex })));
}

function copy(locale: Locale, he: PackCopy, en: PackCopy) {
  return locale === "he" ? he : en;
}

const apparelHe: PackCopy = {
  offer: "בגד שאנשים לובשים בפועל, לא רק מצלמים",
  unit: "פריט שנמכר",
  problems: [
    "קשה למצוא פריט שנראה מסודר גם אחרי אימון ולא רק על קולב",
    "מידות, בד והחזרות הופכים קנייה ראשונה להימור",
    "מותגים גדולים מרגישים אחידים, ומותגים קטנים נעלמים אחרי עונה",
  ],
  strengths: [
    "אפשר לבדוק ביקוש עם דגם אחד או שניים לפני מלאי רחב",
    "הסיפור של הבד, הגזרה והשימוש היומיומי ניתן להסבר בלי מצגת",
  ],
  weaknesses: [
    "מזומן נתקע במלאי אם המידה או המחיר לא יושבים",
    "איכות תפירה וזמני אספקה קשים לשליטה בלי ספק מוכר",
  ],
  channels: ["אינסטגרם עם פירוט בד ומידה", "וואטסאפ לקבוצת ניסיון", "אתר עם מדיניות החזרות ברורה", "שיתוף עם מאמנים, לא עם כמות עוקבים"],
  operations: [
    "לבחור ספק אחד לדגם הראשון ולתעד עלות אמיתית ליחידה",
    "להגדיר טבלת מידות על בסיס מדידות, לא על בסיס תחושה",
    "לשמור רזרבה למלאי מת ולא להוציא אותה על צילום",
  ],
  competitorCategories: [
    "מותגי ספורט בינלאומיים שמוכרים בארץ",
    "מותגי אופנה מקומיים עם מחיר קרוב",
    "חנויות אונליין כלליות עם משלוח מהיר",
  ],
  risks: [
    { title: "מלאי שלא זז", detail: "הזמנה ראשונה גדולה מדי יחסית לביקוש שנבדק.", mitigation: "להגביל את ההזמנה הראשונה לכמות שאפשר למכור בשיחות אישיות." },
    { title: "פער בין עלות למחיר", detail: "אחרי בד, תפירה, אריזה ומשלוח נשארת תרומה דקה.", mitigation: "לחשב עלות יחידה מלאה לפני פרסום מחיר, ולעדכן את המודל." },
    { title: "החזרות", detail: "בגד אונליין חוזר כשהמידה לא ברורה.", mitigation: "לצלם מידות על אנשים אמיתיים ולכתוב מדיניות החזרה לפני המכירה." },
  ],
  revenue: [
    { name: "מכירה ישירה באתר", description: "השליטה במחיר ובלקוח נשארת אצלכם. דורשת סליקה, משלוח ושירות." },
    { name: "הזמנה מוקדמת", description: "גבייה לפני ייצור מורידה סיכון מלאי. עובדת רק אם ההבטחה למועד אספקה כנה." },
    { name: "מכירה שקטה לקבוצה", description: "קבוצת ניסיון קונה ראשונה. זה לא ערוץ צמיחה, זה מבחן." },
  ],
  startupNames: ["דוגמאות ופיתוח דגם", "מלאי ראשון מצומצם", "מיתוג וצילום", "אתר וסליקה", "תוכן השקה", "רזרבה"],
  monthly: [
    { name: "אריזה ומשלוחים", amountIls: 500 },
    { name: "כלים, דומיין וסליקה", amountIls: 180 },
    { name: "תוכן ומדיה בתשלום", amountIls: 1500 },
    { name: "הנהלת חשבונות", amountIls: 300 },
    { name: "שכר מייסדים", amountIls: 0 },
  ],
  names: [
    { name: "קו אורך", note: "שם עברי קצר, כיוון שקט" },
    { name: "בסיס שקט", note: "מתאים לשכבת בסיס, לא להבטחת ביצועים" },
    { name: "ORECH", note: "גרסה לטינית לבדיקת דומיין" },
    { name: "אריג", note: "דגש על חומר, לא על סלוגן כושר" },
    { name: "נוע", note: "קצר, דורש בדיקה שהוא לא תפוס" },
    { name: "שכבה", note: "ישיר, פחות אופנתי" },
  ],
};

const apparelEn: PackCopy = {
  ...apparelHe,
  offer: "a garment people actually train in",
  unit: "item sold",
  problems: [
    "It is hard to find a piece that still looks considered after a workout.",
    "Fit, fabric, and returns make the first order a guess.",
    "Large brands feel interchangeable, and small ones disappear after a season.",
  ],
  strengths: ["Demand can be tested with one or two styles before a wide inventory.", "Fabric, cut, and daily use can be explained without a pitch deck."],
  weaknesses: ["Cash gets stuck in inventory when size or price is wrong.", "Stitching and lead times are hard to control with an unproven supplier."],
  channels: ["Instagram with fabric and fit detail", "A small trial group", "A site with a plain returns policy", "Trainers, not follower counts"],
  operations: ["Pick one supplier for the first style and record the true unit cost.", "Build a size chart from measurements.", "Keep a reserve for unsold stock."],
  competitorCategories: ["International sports brands sold locally", "Local fashion labels at a nearby price", "General online stores with fast shipping"],
  risks: [
    { title: "Unsold inventory", detail: "The first production run is larger than tested demand.", mitigation: "Limit the first run to what you can sell through direct conversations." },
    { title: "Cost versus price", detail: "Fabric, make, packaging, and shipping leave a thin contribution.", mitigation: "Calculate full unit cost before publishing a price." },
    { title: "Returns", detail: "Online apparel comes back when fit is unclear.", mitigation: "Show fit on real people and write the returns rule before selling." },
  ],
  revenue: [
    { name: "Direct site sales", description: "You keep price and customer relationship. You also own payments, shipping, and service." },
    { name: "Preorder", description: "Charging before production lowers inventory risk if the delivery date is honest." },
    { name: "Quiet group sale", description: "A first cohort buys. This tests the offer. It is not a growth channel." },
  ],
  startupNames: ["Samples and pattern", "Small first inventory", "Identity and photos", "Site and payments", "Launch content", "Reserve"],
  monthly: [
    { name: "Packaging and shipping", amountIls: 500 },
    { name: "Tools, domain, payments", amountIls: 180 },
    { name: "Content and paid media", amountIls: 1500 },
    { name: "Bookkeeping", amountIls: 300 },
    { name: "Founder pay", amountIls: 0 },
  ],
  names: [
    { name: "ORECH", note: "Short Latin mark for a domain check" },
    { name: "Quiet Base", note: "Base-layer tone, no performance claim" },
    { name: "Field Layer", note: "Material first" },
    { name: "Second Cloth", note: "Everyday, not athletic hype" },
    { name: "Kav", note: "Needs a register and domain check" },
    { name: "Still Moving", note: "Longer, more editorial" },
  ],
};

function servicePack(locale: Locale, he: PackCopy, en: PackCopy, economics: Pick<Pack, "cogs" | "price" | "customers" | "palettes">): Pack {
  return { ...copy(locale, he, en), ...economics, startupRatios: RATIO };
}

const apparelPalettes = palette([
  [["חול", "#E6E0D4"], ["דיו", "#1B1B19"], ["זית", "#5C6844"], ["נייר", "#F7F4EE"]],
  [["פחם", "#141414"], ["אבן", "#D8D4CC"], ["חרס", "#B85A45"], ["לבן", "#F6F5F2"]],
  [["יער", "#243028"], ["קרם", "#F3EEE4"], ["פליז", "#B9975B"], ["ערפל", "#E4E6E0"]],
]);

export function getPack(industry: IndustryKey, locale: Locale, angle: string): Pack {
  const packs: Record<IndustryKey, Pack> = {
    apparel: servicePack(locale, apparelHe, apparelEn, {
      cogs: 0.45,
      price: { value: 129, mid: 219, premium: 349, luxury: 690 },
      customers: { value: 40, mid: 24, premium: 14, luxury: 6 },
      palettes: apparelPalettes,
    }),
    fitness: servicePack(
      locale,
      {
        offer: "אימון שאנשים חוזרים אליו",
        unit: "מנוי או חבילת מפגשים",
        problems: ["קשה להתמיד כשהשיעור לא נכנס ביומן", "מנויים מרגישים חוזה, לא התקדמות", "סטודיו חדש נשפט לפי השבועיים הראשונים"],
        strengths: ["אפשר למלא קבוצה ראשונה בלי משרד גדול", "תוצאה מורגשת בלי להמציא נתון"],
        weaknesses: ["ההכנסה תלויה בהגעה, לא רק בהרשמה", "שעת שיא מוגבלת במספר מקומות"],
        channels: ["המלצה ממקום עבודה או בניין", "שיעור ניסיון קצר", "אינסטגרם שמראה מבנה אימון", "שיתוף עם קליניקה או חנות מקומית"],
        operations: ["לקבוע לוח שעות שאפשר לקיים שלושה חודשים", "להגדיר גודל קבוצה לפי המרחב", "לגבות מראש ולכתוב מדיניות ביטול"],
        competitorCategories: ["חדרי כושר שכונתיים", "סטודיו בוטיק", "אימונים אונליין"],
        risks: [
          { title: "לוח שלא מחזיק", detail: "ההבטחה גדולה מהשעות שאפשר לאייש.", mitigation: "לפרסם רק שעות שכבר חסומות ביומן." },
          { title: "נטישה אחרי ניסיון", detail: "שיעור ראשון לא הופך להרגל.", mitigation: "להגדיר מה קורה בשבועיים שאחרי הניסיון." },
          { title: "אחריות בטיחות", detail: "אימון הוא לא תוכן. יש סיכון לפציעה.", mitigation: "לברר ביטוח והכשרה מול איש מקצוע לפני הקבוצה הראשונה." },
        ],
        revenue: [
          { name: "חבילת מפגשים", description: "תשלום מראש על מספר מפגשים. פשוט לבדיקה." },
          { name: "מנוי חודשי", description: "הכנסה חוזרת רק אם אנשים נשארים. לא להניח שימור." },
          { name: "סדנה לקבוצה סגורה", description: "ארגון או קהילה קונים סדרה. תלוי במכירה אחת ברורה." },
        ],
        startupNames: ["הכשרה וציוד בסיסי", "מרחב או שכירות ראשונה", "מיתוג", "אתר והרשמה", "גיוס קבוצה", "רזרבה"],
        monthly: [
          { name: "שכירות או שותפות מרחב", amountIls: 2500 },
          { name: "ביטוח ותוכנה", amountIls: 350 },
          { name: "שיווק מקומי", amountIls: 800 },
          { name: "הנהלת חשבונות", amountIls: 300 },
          { name: "שכר מייסדים", amountIls: 0 },
        ],
        names: [
          { name: "שעה קבועה", note: "מבטיח לוח, לא תוצאת גוף" },
          { name: "קומה", note: "מקום, לא סיסמה" },
          { name: "חזרה", note: "דגש על התמדה" },
          { name: "סטודיו ראשון", note: "ישיר מדי, טוב לבדיקה" },
          { name: "קצב", note: "לבדוק סימן מסחר" },
          { name: "SET HOUR", note: "אפשרות לטינית" },
        ],
      },
      {
        offer: "training people return to",
        unit: "membership or session pack",
        problems: ["Consistency fails when the session does not fit the week.", "Memberships feel like a contract, not progress.", "A new studio is judged in the first two weeks."],
        strengths: ["A first group can fill without a large lease.", "Progress can be described without invented metrics."],
        weaknesses: ["Revenue depends on attendance, not sign-ups.", "Peak hours have a hard capacity."],
        channels: ["Referrals from a workplace or building", "A short trial", "Instagram that shows the session structure", "A local clinic or shop"],
        operations: ["Publish only hours you can keep for three months.", "Set group size from the room.", "Charge ahead and write a cancellation rule."],
        competitorCategories: ["Neighborhood gyms", "Boutique studios", "Online training"],
        risks: [
          { title: "A timetable you cannot keep", detail: "The promise is larger than staffed hours.", mitigation: "Publish only hours already blocked on the calendar." },
          { title: "Drop-off after the trial", detail: "A first session does not become a habit.", mitigation: "Define the two weeks after the trial before selling it." },
          { title: "Safety", detail: "Training is not content. Injury risk is real.", mitigation: "Confirm insurance and qualifications before the first group." },
        ],
        revenue: [
          { name: "Session pack", description: "Prepay a fixed number of sessions." },
          { name: "Monthly membership", description: "Repeating revenue only if people stay. Do not assume retention." },
          { name: "Closed group", description: "One organization buys a series." },
        ],
        startupNames: ["Certification and basic equipment", "First space", "Identity", "Site and booking", "First group", "Reserve"],
        monthly: [
          { name: "Space", amountIls: 2500 },
          { name: "Insurance and software", amountIls: 350 },
          { name: "Local marketing", amountIls: 800 },
          { name: "Bookkeeping", amountIls: 300 },
          { name: "Founder pay", amountIls: 0 },
        ],
        names: [
          { name: "Set Hour", note: "A timetable, not a body claim" },
          { name: "First Floor", note: "Place, not a slogan" },
          { name: "Return Set", note: "Consistency" },
          { name: "Room Three", note: "Plain" },
          { name: "Kept", note: "Check the mark" },
          { name: "Week Rate", note: "More descriptive" },
        ],
      },
      {
        cogs: 0.22,
        price: { value: 180, mid: 320, premium: 480, luxury: 900 },
        customers: { value: 30, mid: 18, premium: 12, luxury: 6 },
        palettes: palette([
          [["בטון", "#D9D5CE"], ["פחם", "#1E2422"], ["ליים עמוק", "#C5D36A"], ["לבן", "#F7F7F4"]],
          [["לילה", "#121417"], ["פלדה", "#8D97A3"], ["לבן חם", "#F4F1EA"], ["אות", "#E36A3D"]],
          [["אדמה", "#6B4E3D"], ["חול", "#E9E1D4"], ["עלים", "#3E5344"], ["קרם", "#F6F3EC"]],
        ]),
      },
    ),
    food: foodPack(locale),
    saas: saasPack(locale),
    services: servicesPack(locale),
    education: educationPack(locale),
    beauty: beautyPack(locale),
    hospitality: hospitalityPack(locale),
    retail: retailPack(locale),
    general: generalPack(locale),
  };
  const pack = packs[industry];
  pack.palettes = pack.palettes.map((row) =>
    row.map((color) => ({
      hex: color.hex,
      name: locale === "en" ? (COLOR_EN[color.name] ?? color.name) : color.name,
    })),
  );
  if (industry === "apparel" && angle === "fitness") {
    pack.offer = locale === "he" ? "ביגוד לאימון ולדרך אליו" : "apparel for training and the hours around it";
  }
  if (industry === "food" && angle === "coffee") {
    pack.offer = locale === "he" ? "קפה עם טעם ומקום ברורים" : "coffee with a clear taste and place";
    pack.unit = locale === "he" ? "כוס או שקית" : "cup or bag";
  }
  return pack;
}

function foodPack(locale: Locale): Pack {
  return servicePack(
    locale,
    {
      offer: "אוכל או שתייה שאנשים חוזרים לקנות",
      unit: "הזמנה",
      problems: ["טעם לא עקבי בין ביקורים", "מחיר לא ברור מול מנות מוכנות אחרות", "שעות פעילות שלא תואמות את הלקוח"],
      strengths: ["אפשר למכור תפריט קצר לפני מטבח מלא", "פידבק מגיע באותו יום"],
      weaknesses: ["פחת וקלקול שורפים מזומן", "תלות בספק וברישיון"],
      channels: ["השקה לשכנים ולמשרדים קרובים", "הזמנה מראש בוואטסאפ", "גוגל בעברית", "שיתוף עם חנות סמוכה"],
      operations: ["תפריט של מעט פריטים עם עלות מנה ידועה", "בדיקת רישוי מול הרשות, לא לפי שמועה", "ספירת פחת שבועית"],
      competitorCategories: ["מקומות באותו רחוב", "משלוחים באפליקציות", "מוצרים ארוזים בסופר"],
      risks: [
        { title: "פחת", detail: "קונים פחות ממה שנקנה בבוקר.", mitigation: "להתחיל בתפריט קצר ובכמויות שאפשר למכור ביום." },
        { title: "רישוי", detail: "מזון דורש עמידה בכללים מקומיים.", mitigation: "לברר רישיון, תיוג ואלרגנים לפני מכירה." },
        { title: "תלות בפלטפורמה", detail: "עמלה של אפליקציה מוחקת את הרווח הגולמי.", mitigation: "לחשב מחיר אחרי עמלה, לא לפניה." },
      ],
      revenue: [
        { name: "מכירה במקום", description: "שליטה בחוויה. דורשת נוכחות." },
        { name: "הזמנה מראש", description: "מפחיתה פחת." },
        { name: "מכירה לארגונים", description: "הזמנה שבועית קבועה, אם מישהו באמת חותם." },
      ],
      startupNames: ["ציוד ומטבח קטן", "מלאי פתיחה", "מיתוג ואריזה", "אתר או דף הזמנה", "השקה מקומית", "רזרבה"],
      monthly: [
        { name: "שכירות או עמלה", amountIls: 3000 },
        { name: "אנרגיה וכלים", amountIls: 700 },
        { name: "שיווק מקומי", amountIls: 600 },
        { name: "הנהלת חשבונות", amountIls: 350 },
        { name: "שכר מייסדים", amountIls: 0 },
      ],
      names: [
        { name: "שולחן קטן", note: "מקום, לא הבטחת טעם" },
        { name: "כוס שנייה", note: "מתאים לקפה" },
        { name: "לפני הצהריים", note: "חלון זמן" },
        { name: "גרגר", note: "קצר" },
        { name: "בית התה", note: "לבדוק אם השם פנוי" },
        { name: "SECOND CUP", note: "לטיני, גנרי יחסית" },
      ],
    },
    {
      offer: "food or drink people buy again",
      unit: "order",
      problems: ["Taste changes between visits.", "Price is hard to judge against ready meals.", "Hours miss the customer."],
      strengths: ["A short menu can sell before a full kitchen.", "Feedback arrives the same day."],
      weaknesses: ["Waste burns cash.", "You depend on suppliers and permits."],
      channels: ["Neighbors and nearby offices", "Preorder", "Local search", "A neighboring shop"],
      operations: ["A short menu with a known plate cost.", "Check permits with the authority.", "Count waste weekly."],
      competitorCategories: ["Places on the same street", "Delivery apps", "Packaged goods in a shop"],
      risks: [
        { title: "Waste", detail: "You buy more than the day sells.", mitigation: "Start with a short menu and same-day quantities." },
        { title: "Permits", detail: "Food has local rules.", mitigation: "Confirm licensing, labels, and allergens before selling." },
        { title: "Platform fees", detail: "A delivery commission can erase gross margin.", mitigation: "Price after the fee." },
      ],
      revenue: [
        { name: "On premise", description: "You control the visit. You must be there." },
        { name: "Preorder", description: "Cuts waste." },
        { name: "Office order", description: "A weekly order, if someone actually signs." },
      ],
      startupNames: ["Small kitchen setup", "Opening inventory", "Identity and packaging", "Order page", "Local launch", "Reserve"],
      monthly: [
        { name: "Rent or commission", amountIls: 3000 },
        { name: "Energy and tools", amountIls: 700 },
        { name: "Local marketing", amountIls: 600 },
        { name: "Bookkeeping", amountIls: 350 },
        { name: "Founder pay", amountIls: 0 },
      ],
      names: [
        { name: "Small Table", note: "A place, not a taste claim" },
        { name: "Second Cup", note: "Coffee-leaning" },
        { name: "Before Noon", note: "A time window" },
        { name: "Grain", note: "Short" },
        { name: "House Pour", note: "Check the mark" },
        { name: "Week Kitchen", note: "Operational" },
      ],
    },
    {
      cogs: 0.38,
      price: { value: 28, mid: 46, premium: 68, luxury: 120 },
      customers: { value: 80, mid: 50, premium: 30, luxury: 16 },
      palettes: palette([
        [["קרם", "#F3EBDD"], ["קפה", "#3B2A22"], ["עגבנייה", "#A33B2B"], ["נייר", "#FBF8F3"]],
        [["לילה", "#1A1714"], ["חלב", "#E7D7C1"], ["זהב עמום", "#A68456"], ["לבן", "#F7F4EF"]],
        [["עלים", "#2F4636"], ["אבן", "#D9D3C7"], ["חלמון", "#E0B15A"], ["שחור", "#171513"]],
      ]),
    },
  );
}

function saasPack(locale: Locale): Pack {
  return servicePack(
    locale,
    {
      offer: "כלי שעבודה חוזרת נעשית בו מהר יותר",
      unit: "מנוי פעיל",
      problems: ["העבודה היומית מפוזרת בין גיליונות והודעות", "כלים גדולים יקרים או כבדים מדי", "אין אמון בכלי חדש בלי תוצאה בשבוע הראשון"],
      strengths: ["אפשר למכור לפני שהמוצר רחב", "עלות שרת התחלתית נמוכה יחסית למלאי"],
      weaknesses: ["בלי הרגל שימוש, מנוי מתבטל", "תמיכה גוזלת את זמן הבנייה"],
      channels: ["שיחות עם 15 אנשים שעושים את העבודה היום", "קהילה מקצועית", "תוכן שמראה את הלפני ואחרי", "שותף שכבר מדבר עם הלקוח"],
      operations: ["להגדיר פעולה אחת שהמוצר חוסך", "למדוד הפעלה בשבוע הראשון", "לתמחר תמיכה, לא רק מנוי"],
      competitorCategories: ["גיליון ודואר", "תוכנה כללית בקטגוריה", "כלי פנימי שהלקוח כבר בנה"],
      risks: [
        { title: "אין הרגל", detail: "נרשמים ולא חוזרים.", mitigation: "להגדיר את הפעולה שצריכה לקרות ביום הראשון." },
        { title: "בנייה בלי קונה", detail: "חודשים של פיתוח לפני שיחה על מחיר.", mitigation: "לגבות או לקבל התחייבות לפני היקף גדול." },
        { title: "תמיכה", detail: "כל לקוח דורש ליווי שלא תומחר.", mitigation: "להכניס שעת תמיכה למודל החודשי." },
      ],
      revenue: [
        { name: "מנוי חודשי", description: "המודל המרכזי. תלוי בשימור, לא בהרשמה." },
        { name: "הטמעה חד פעמית", description: "תשלום על הקמה. כנה יותר בהתחלה." },
        { name: "תוכנית לצוות", description: "מחיר לפי מושבים, רק אם יש צוות אמיתי." },
      ],
      startupNames: ["בנייה וכלים", "עיצוב מוצר", "אתר", "הקמה משפטית וחשבונאית", "שיחות השקה", "רזרבה"],
      monthly: [
        { name: "תשתית ותוכנות", amountIls: 400 },
        { name: "תמיכה וכלים", amountIls: 300 },
        { name: "שיווק", amountIls: 800 },
        { name: "הנהלת חשבונות", amountIls: 300 },
        { name: "שכר מייסדים", amountIls: 0 },
      ],
      names: [
        { name: "שורה", note: "פשוט, תפעולי" },
        { name: "לפני הצהריים", note: "פחות מתאים, שמור לבדיקה" },
        { name: "מסך אחד", note: "הבטחת פשטות, יש לקיים אותה" },
        { name: "קצב עבודה", note: "תיאורי" },
        { name: "DESK ROW", note: "לטיני" },
        { name: "פעם בשבוע", note: "מתאר תדירות, לא מוצר" },
      ],
    },
    {
      offer: "a tool that makes a repeated job faster",
      unit: "active subscription",
      problems: ["The daily job is split across sheets and messages.", "Large tools are costly or heavy.", "Nobody trusts a new tool without a result in week one."],
      strengths: ["You can sell before the product is wide.", "Early hosting is cheap relative to inventory."],
      weaknesses: ["Without a habit, the subscription cancels.", "Support eats building time."],
      channels: ["Fifteen conversations with people who do the job now", "A professional community", "A before-and-after note", "A partner who already speaks to the buyer"],
      operations: ["Name the one action the product saves.", "Measure week-one activation.", "Price support, not only the seat."],
      competitorCategories: ["A spreadsheet and email", "General software in the category", "An internal tool the buyer already built"],
      risks: [
        { title: "No habit", detail: "People sign up and do not return.", mitigation: "Define the action that must happen on day one." },
        { title: "Building without a buyer", detail: "Months of product before a price conversation.", mitigation: "Take money or a written commitment before a large scope." },
        { title: "Support", detail: "Each customer needs unpriced help.", mitigation: "Put a support hour into the monthly model." },
      ],
      revenue: [
        { name: "Monthly subscription", description: "The core model. It depends on retention, not sign-ups." },
        { name: "Setup fee", description: "A one-time onboarding charge. Often more honest at the start." },
        { name: "Team plan", description: "Per seat, only if a team exists." },
      ],
      startupNames: ["Building and tools", "Product design", "Site", "Legal and accounting setup", "Launch conversations", "Reserve"],
      monthly: [
        { name: "Infrastructure", amountIls: 400 },
        { name: "Support tools", amountIls: 300 },
        { name: "Marketing", amountIls: 800 },
        { name: "Bookkeeping", amountIls: 300 },
        { name: "Founder pay", amountIls: 0 },
      ],
      names: [
        { name: "One Desk", note: "Operational" },
        { name: "Row", note: "Plain" },
        { name: "Week List", note: "Frequency, not a feature claim" },
        { name: "Clear Queue", note: "Check the mark" },
        { name: "First Pass", note: "Process" },
        { name: "Held", note: "Short" },
      ],
    },
    {
      cogs: 0.12,
      price: { value: 49, mid: 99, premium: 249, luxury: 690 },
      customers: { value: 40, mid: 20, premium: 8, luxury: 3 },
      palettes: palette([
        [["נייר", "#F4F6F1"], ["דיו", "#17211C"], ["קו", "#7D8F72"], ["לבן", "#FFFFFF"]],
        [["שחור", "#101311"], ["אפור", "#C9CDC4"], ["אות", "#E2F07A"], ["לבן", "#F7F8F4"]],
        [["כחול דיו", "#1E2A33"], ["חול", "#E6E1D6"], ["נחושת", "#A96B4C"], ["קרם", "#F6F3EE"]],
      ]),
    },
  );
}

function servicesPack(locale: Locale): Pack {
  return servicePack(
    locale,
    baseService("he"),
    baseService("en"),
    {
      cogs: 0.2,
      price: { value: 400, mid: 900, premium: 1800, luxury: 4000 },
      customers: { value: 8, mid: 5, premium: 3, luxury: 2 },
      palettes: palette([
        [["שנהב", "#F6F1E7"], ["פחם", "#1C1C1A"], ["ירוק ספרייה", "#2F4A3C"], ["קו", "#D9D3C6"]],
        [["לבן", "#F7F7F5"], ["שחור", "#111111"], ["אדום עמום", "#8E3B32"], ["אפור", "#E4E2DC"]],
        [["חול", "#E7E0D4"], ["כחול לילה", "#1B2430"], ["פליז", "#C6A15B"], ["ערפל", "#EEF0EA"]],
      ]),
    },
  );
}

function baseService(locale: Locale): PackCopy {
  if (locale === "en") {
    return {
      offer: "a defined piece of work with a price",
      unit: "engagement",
      problems: ["Buyers cannot tell what they will get.", "Scope expands after the quote.", "Trust is personal, so the first clients come slowly."],
      strengths: ["You can sell a pilot without inventory.", "A clear deliverable is easy to discuss."],
      weaknesses: ["Your hours are the constraint.", "A cheap price becomes the reference."],
      channels: ["Past colleagues", "A written case of one project", "A short diagnostic call", "A partner who already has the buyer"],
      operations: ["Write the deliverable in one sentence.", "Cap the hours inside the price.", "Invoice a deposit before starting."],
      competitorCategories: ["Freelancers with a similar offer", "Agencies", "Doing it in-house"],
      risks: [
        { title: "Unpriced scope", detail: "The work grows after a yes.", mitigation: "List what is outside the offer before kickoff." },
        { title: "A race to a low fee", detail: "The first discount sets the next quote.", mitigation: "Publish a floor and keep it." },
        { title: "Founder bottleneck", detail: "Every project needs you.", mitigation: "Document the steps of the pilot before selling a second one." },
      ],
      revenue: [
        { name: "Fixed pilot", description: "One price, one deliverable, one date." },
        { name: "Monthly retainer", description: "Only after the pilot showed a repeated need." },
        { name: "Workshop", description: "A paid diagnostic. Not a free pitch." },
      ],
      startupNames: ["Tools and setup", "Identity", "Site", "Sales material", "First outreach", "Reserve"],
      monthly: [
        { name: "Tools", amountIls: 250 },
        { name: "Travel and meetings", amountIls: 400 },
        { name: "Marketing", amountIls: 700 },
        { name: "Bookkeeping", amountIls: 300 },
        { name: "Founder pay", amountIls: 0 },
      ],
      names: [
        { name: "Plain Brief", note: "Describes the work" },
        { name: "First Desk", note: "Studio tone" },
        { name: "Held Work", note: "Check the mark" },
        { name: "Scope", note: "Direct" },
        { name: "North Room", note: "Place" },
        { name: "Two Weeks", note: "A pilot length" },
      ],
    };
  }
  return {
    offer: "עבודה מוגדרת עם מחיר",
    unit: "התקשרות",
    problems: ["הלקוח לא מבין מה יקבל", "ההיקף גדל אחרי הצעת המחיר", "האמון אישי, אז הלקוחות הראשונים מגיעים לאט"],
    strengths: ["אפשר למכור פיילוט בלי מלאי", "תוצר ברור קל לשיחה"],
    weaknesses: ["השעות שלכם הן המגבלה", "מחיר נמוך בהתחלה הופך לעוגן"],
    channels: ["עמיתים לשעבר", "תיאור כתוב של פרויקט אחד", "שיחת אבחון קצרה", "שותף שכבר מדבר עם הקונה"],
    operations: ["לנסח את התוצר במשפט", "לתחום שעות בתוך המחיר", "לקבל מקדמה לפני תחילת עבודה"],
    competitorCategories: ["עצמאים עם הצעה דומה", "משרדים", "עבודה פנימית אצל הלקוח"],
    risks: [
      { title: "היקף שלא תומחר", detail: "העבודה גדלה אחרי הסכמה.", mitigation: "לכתוב מה לא כלול לפני שמתחילים." },
      { title: "מחיר רצפה נמוך", detail: "הנחה ראשונה קובעת את ההצעה הבאה.", mitigation: "לקבוע מחיר מינימום ולשמור עליו." },
      { title: "צוואר בקבוק", detail: "כל פרויקט דורש אתכם.", mitigation: "לתעד את צעדי הפיילוט לפני שמוכרים פרויקט שני." },
    ],
    revenue: [
      { name: "פיילוט במחיר קבוע", description: "מחיר אחד, תוצר אחד, תאריך אחד." },
      { name: "ריטיינר", description: "רק אחרי שהפיילוט הראה צורך חוזר." },
      { name: "סדנת אבחון", description: "בתשלום. לא פגישת מכירה חינם." },
    ],
    startupNames: ["כלים והקמה", "מיתוג", "אתר", "חומרי מכירה", "פנייה ראשונה", "רזרבה"],
    monthly: [
      { name: "כלים", amountIls: 250 },
      { name: "נסיעות ופגישות", amountIls: 400 },
      { name: "שיווק", amountIls: 700 },
      { name: "הנהלת חשבונות", amountIls: 300 },
      { name: "שכר מייסדים", amountIls: 0 },
    ],
    names: [
      { name: "תיק ברור", note: "מתאר עבודה, לא הבטחה" },
      { name: "שולחן ראשון", note: "סטודיו" },
      { name: "היקף", note: "ישיר" },
      { name: "שבועיים", note: "אורך פיילוט" },
      { name: "חדר צפוני", note: "מקום" },
      { name: "BRIEF", note: "לטיני, לבדיקת דומיין" },
    ],
  };
}

function educationPack(locale: Locale): Pack {
  const base = baseService(locale);
  if (locale === "he") {
    base.offer = "לימוד עם תוצר שהמשתתף יוצא איתו";
    base.unit = "מקום בקבוצה";
    base.problems = ["קורסים נמכרים כהבטחת קריירה בלי תוצר", "קשה להתמיד לבד", "המחיר לא ברור מול תוכן חינמי"];
    base.names = [
      { name: "קבוצת עבודה", note: "מבנה, לא הבטחת תוצאה" },
      { name: "שיעור פתוח", note: "ישיר" },
      { name: "מחזור ראשון", note: "מתאר שלב" },
      { name: "דף ועט", note: "צנוע" },
      { name: "שולחן לימוד", note: "מקום" },
      { name: "COHORT", note: "מקובל, גנרי" },
    ];
  } else {
    base.offer = "teaching that ends with something the student made";
    base.unit = "seat";
    base.problems = ["Courses are sold as a career promise without an artifact.", "People do not finish alone.", "Price is unclear next to free content."];
    base.names = [
      { name: "Work Group", note: "A format, not an outcome promise" },
      { name: "Open Lesson", note: "Direct" },
      { name: "First Cohort", note: "A stage" },
      { name: "Page and Pen", note: "Modest" },
      { name: "Study Table", note: "A place" },
      { name: "Held Class", note: "Check the mark" },
    ];
  }
  return servicePack(locale, base, base, {
    cogs: 0.25,
    price: { value: 180, mid: 450, premium: 1200, luxury: 2800 },
    customers: { value: 20, mid: 12, premium: 8, luxury: 4 },
    palettes: palette([
      [["נייר", "#F7F3EA"], ["דיו", "#1F2430"], ["כחול", "#2C4A7A"], ["חול", "#E4D9C4"]],
      [["קרם", "#F3EEE4"], ["חום", "#3A2E28"], ["כתום עמום", "#C46A3A"], ["לבן", "#FBF9F5"]],
      [["לבן", "#F6F7F4"], ["שחור", "#171917"], ["ירוק", "#3E5C49"], ["אפור", "#D5D8D0"]],
    ]),
  });
}

function beautyPack(locale: Locale): Pack {
  const base = baseService(locale);
  if (locale === "he") {
    base.offer = "טיפול או מוצר טיפוח עם ציפייה כנה";
    base.unit = "טיפול או יחידה";
    base.problems = ["הבטחות תוצאה שלא נמדדות", "רגישות למרכיבים", "קשה לבדל טיפול בלי שפה מוגזמת"];
    base.risks[0] = { title: "הבטחת תוצאה", detail: "שפה שיווקית נשמעת כמו התחייבות רפואית.", mitigation: "לתאר את הטיפול, לא תוצאה על העור של אדם מסוים." };
  } else {
    base.offer = "a treatment or product with an honest expectation";
    base.unit = "treatment or unit";
    base.problems = ["Result claims that are not measured.", "Ingredient sensitivity.", "Hard to differentiate without inflated language."];
    base.risks[0] = { title: "A result claim", detail: "Marketing language sounds like a medical promise.", mitigation: "Describe the treatment, not a result on a specific person's skin." };
  }
  return servicePack(locale, base, base, {
    cogs: 0.35,
    price: { value: 90, mid: 180, premium: 320, luxury: 700 },
    customers: { value: 30, mid: 18, premium: 10, luxury: 5 },
    palettes: palette([
      [["אבקה", "#F6EFEA"], ["חום", "#3C2C2A"], ["ורוד עמום", "#C98986"], ["לבן", "#FFFcf9"]],
      [["שחור", "#161311"], ["אבן", "#E7E0D8"], ["נחושת", "#A96B4C"], ["קרם", "#F8F4EF"]],
      [["מרווה", "#D9E0D6"], ["דיו", "#1E2420"], ["חול", "#E6DCCB"], ["לבן", "#F7F6F2"]],
    ]),
  });
}

function hospitalityPack(locale: Locale): Pack {
  const base = baseService(locale);
  if (locale === "he") {
    base.offer = "שהייה עם כללים ברורים";
    base.unit = "לילה או אירוח";
    base.problems = ["האורח לא יודע מה כלול", "עונתיות משאירה לילות ריקים", "תפעול שוטף יקר יותר מהצילום"];
  } else {
    base.offer = "a stay with clear rules";
    base.unit = "night or booking";
    base.problems = ["Guests cannot tell what is included.", "Seasonality leaves empty nights.", "Operations cost more than the photos."];
  }
  return servicePack(locale, base, base, {
    cogs: 0.32,
    price: { value: 350, mid: 650, premium: 1100, luxury: 2200 },
    customers: { value: 12, mid: 8, premium: 5, luxury: 3 },
    palettes: palette([
      [["פשתן", "#EFE6D6"], ["עץ", "#5A4636"], ["ים", "#1F3A40"], ["לבן", "#F8F5EF"]],
      [["חול", "#E7DCC8"], ["שחור", "#1A1917"], ["טרקוטה", "#B8613E"], ["קרם", "#F6F1E8"]],
      [["אפור חם", "#D9D4CC"], ["ירוק זית", "#3D4634"], ["לבן", "#F7F6F2"], ["פליז", "#B89A62"]],
    ]),
  });
}

function retailPack(locale: Locale): Pack {
  const apparel = getRawApparel(locale);
  apparel.offer = locale === "he" ? "מוצר על מדף, עם מחיר וזמינות" : "a product on a shelf, with a price and availability";
  apparel.unit = locale === "he" ? "יחידה" : "unit";
  return servicePack(locale, apparel, apparel, {
    cogs: 0.5,
    price: { value: 49, mid: 99, premium: 189, luxury: 420 },
    customers: { value: 50, mid: 30, premium: 16, luxury: 8 },
    palettes: apparelPalettes,
  });
}

function getRawApparel(locale: Locale) {
  return locale === "he" ? structuredClone(apparelHe) : structuredClone(apparelEn);
}

function generalPack(locale: Locale): Pack {
  const base = baseService(locale);
  if (locale === "he") {
    base.offer = "הצעה שאפשר להסביר במשפט ולמכור בקנה מידה קטן";
    base.unit = "מכירה";
  } else {
    base.offer = "an offer you can explain in one sentence and sell at a small scale";
    base.unit = "sale";
  }
  return servicePack(locale, base, base, {
    cogs: 0.35,
    price: { value: 80, mid: 160, premium: 320, luxury: 800 },
    customers: { value: 20, mid: 12, premium: 8, luxury: 4 },
    palettes: palette([
      [["שנהב", "#F4F1E8"], ["פחם", "#1A1C19"], ["ליים", "#D5EF86"], ["קו", "#E3E5DC"]],
      [["לבן", "#F7F7F4"], ["שחור", "#151515"], ["כחול", "#243044"], ["חול", "#E5DDD0"]],
      [["קרם", "#F3EEE6"], ["ירוק", "#24352C"], ["חרס", "#A85B45"], ["נייר", "#FBF9F4"]],
    ]),
  });
}
