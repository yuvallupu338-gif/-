/** Educational 2026 payroll sketch for a single salaried job. Not tax advice. */

export const CREDIT_POINT_NIS = 242
export const MIN_WAGE_MONTHLY = 6443.85
export const MIN_WAGE_HOURLY = 35.4

const BRACKETS: { upTo: number; rate: number }[] = [
  { upTo: 7010, rate: 0.1 },
  { upTo: 10060, rate: 0.14 },
  { upTo: 19000, rate: 0.2 },
  { upTo: 25100, rate: 0.31 },
  { upTo: 46690, rate: 0.35 },
  { upTo: Number.POSITIVE_INFINITY, rate: 0.47 },
]

const SURTAX_FROM = 60130
const SURTAX = 0.03
const NI_LOW_CAP = 7703
const NI_HIGH_CAP = 51910
const NI_LOW = 0.0104
const HEALTH_LOW = 0.0323
const NI_HIGH = 0.07
const HEALTH_HIGH = 0.0517
const PENSION_RATE = 0.06
const EMPLOYER_PENSION_RATE = 0.065 + 0.06
const PENSION_CREDIT_RATE = 0.35
const PENSION_CREDIT_DEPOSIT_CAP = 9700 * 0.07
const STUDY_RATE = 0.025

export type PayInput = {
  gross: number
  points: number
  studyFund: boolean
}

export type PaySlice = {
  id: string
  label: string
  amount: number
  tone: "green" | "red" | "blue" | "teal" | "purple" | "yellow"
  note: string
}

export type PayResult = {
  gross: number
  incomeTax: number
  nationalInsurance: number
  health: number
  pension: number
  studyFund: number
  net: number
  employerPension: number
  marginalRate: number
  slices: PaySlice[]
}

function roundShekel(value: number) {
  return Math.round(value)
}

export function incomeTaxBeforeCredits(taxable: number) {
  let tax = 0
  let previous = 0
  for (const bracket of BRACKETS) {
    const slice = Math.min(taxable, bracket.upTo) - previous
    if (slice > 0) tax += slice * bracket.rate
    if (taxable <= bracket.upTo) break
    previous = bracket.upTo
  }
  if (taxable > SURTAX_FROM) tax += (taxable - SURTAX_FROM) * SURTAX
  return tax
}

export function marginalIncomeTaxRate(gross: number) {
  const bracket = BRACKETS.find((item) => gross <= item.upTo) ?? BRACKETS[BRACKETS.length - 1]
  return bracket.rate + (gross > SURTAX_FROM ? SURTAX : 0)
}

export function calculatePay(input: PayInput): PayResult {
  const gross = Math.max(0, input.gross)
  const pensionExact = gross * PENSION_RATE
  const pensionCredit =
    Math.min(pensionExact, PENSION_CREDIT_DEPOSIT_CAP) * PENSION_CREDIT_RATE
  const pointsCredit = Math.max(0, input.points) * CREDIT_POINT_NIS
  const incomeTaxExact = Math.max(0, incomeTaxBeforeCredits(gross) - pointsCredit - pensionCredit)

  const insured = Math.min(gross, NI_HIGH_CAP)
  const low = Math.min(insured, NI_LOW_CAP)
  const high = Math.max(0, insured - NI_LOW_CAP)
  const nationalInsuranceExact = low * NI_LOW + high * NI_HIGH
  const healthExact = low * HEALTH_LOW + high * HEALTH_HIGH
  const studyExact = input.studyFund ? gross * STUDY_RATE : 0

  const incomeTax = roundShekel(incomeTaxExact)
  const nationalInsurance = roundShekel(nationalInsuranceExact)
  const health = roundShekel(healthExact)
  const pension = roundShekel(pensionExact)
  const studyFund = roundShekel(studyExact)
  const net = gross - incomeTax - nationalInsurance - health - pension - studyFund

  const slices: PaySlice[] = [
    {
      id: "net",
      label: "נטו לבנק",
      amount: net,
      tone: "green",
      note: "זה הכסף שמתכננים איתו את החודש.",
    },
    {
      id: "tax",
      label: "מס הכנסה",
      amount: incomeTax,
      tone: "red",
      note: "אחרי נקודות זיכוי ואחרי זיכוי של 35% על הפקדת הפנסיה, עד התקרה.",
    },
    {
      id: "ni",
      label: "ביטוח לאומי",
      amount: nationalInsurance,
      tone: "blue",
      note: "חלק העובד בלבד. חלק המעסיק לא אמור לרדת מהנטו.",
    },
    {
      id: "health",
      label: "מס בריאות",
      amount: health,
      tone: "teal",
      note: "נגבה יחד עם ביטוח לאומי, בשתי מדרגות.",
    },
    {
      id: "pension",
      label: "פנסיה (שלך)",
      amount: pension,
      tone: "purple",
      note: "6% מהברוטו. זה חיסכון על שמך, לא מס.",
    },
  ]

  if (studyFund > 0) {
    slices.push({
      id: "study",
      label: "קרן השתלמות (שלך)",
      amount: studyFund,
      tone: "yellow",
      note: "2.5% שנשארים על שמך. החלק של המעסיק מגיע בנוסף.",
    })
  }

  return {
    gross,
    incomeTax,
    nationalInsurance,
    health,
    pension,
    studyFund,
    net,
    employerPension: roundShekel(gross * EMPLOYER_PENSION_RATE),
    marginalRate: marginalIncomeTaxRate(gross),
    slices,
  }
}
