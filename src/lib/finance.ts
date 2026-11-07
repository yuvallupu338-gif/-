import type { Assumptions, LineItem } from "@/lib/domain";
import { clamp, roundTo, uid } from "@/lib/utils";

export type MonthRow = {
  month: number;
  customers: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  opex: number;
  operatingProfit: number;
  cashFlow: number;
  cumulativeCash: number;
};

export type Projection = {
  startupTotal: number;
  monthlyFixed: number;
  contributionPerCustomer: number;
  grossMargin: number;
  breakEvenCustomers: number | null;
  breakEvenMonth: number | null;
  runwayMonth: number | null;
  rows: MonthRow[];
  endingCash: number;
};

export function sumItems(items: LineItem[]) {
  return roundTo(
    items.reduce((total, item) => total + (Number.isFinite(item.amount) ? item.amount : 0), 0),
    2,
  );
}

export function sanitizeAssumptions(input: Assumptions): Assumptions {
  const clean = (item: LineItem): LineItem => ({
    id: item.id || uid(),
    name: item.name.trim().slice(0, 80),
    amount: roundTo(clamp(item.amount, 0, 100_000_000), 2),
    source: item.source === "input" ? "input" : "estimate",
  });
  const startupItems = input.startupItems.filter((item) => item.name.trim()).map(clean);
  const monthlyItems = input.monthlyItems.filter((item) => item.name.trim()).map(clean);
  return {
    startupItems,
    monthlyItems,
    price: roundTo(clamp(input.price, 0, 10_000_000), 2),
    cogsRatio: roundTo(clamp(input.cogsRatio, 0, 0.95), 4),
    startingCustomers: roundTo(clamp(input.startingCustomers, 0, 1_000_000), 2),
    monthlyGrowth: roundTo(clamp(input.monthlyGrowth, -0.8, 1), 4),
    horizon: Math.round(clamp(input.horizon, 1, 36)),
    openingCash: roundTo(clamp(input.openingCash, 0, 100_000_000), 2),
    openingCashSource: input.openingCashSource === "input" ? "input" : "estimate",
    notes: (input.notes ?? "").slice(0, 2000),
  };
}

export function allocate(total: number, parts: { name: string; ratio: number }[], source: LineItem["source"] = "estimate"): LineItem[] {
  const safeTotal = roundTo(Math.max(0, total), 2);
  let used = 0;
  return parts.map((part, index) => {
    const amount =
      index === parts.length - 1 ? roundTo(safeTotal - used, 2) : roundTo(safeTotal * part.ratio, 2);
    used = roundTo(used + amount, 2);
    return { id: `line-${index}-${part.name.length}`, name: part.name, amount, source };
  });
}

/**
 * Deterministic monthly model.
 * Startup costs are paid from opening cash before month 1.
 * Each month: revenue = customers × price, COGS = revenue × cogs ratio,
 * operating profit = revenue − COGS − fixed monthly costs.
 * Cash flow for the month equals operating profit. This is a planning sketch,
 * not accounting statements.
 */
export function project(input: Assumptions): Projection {
  const assumptions = sanitizeAssumptions(input);
  const startupTotal = sumItems(assumptions.startupItems);
  const monthlyFixed = sumItems(assumptions.monthlyItems);
  const contributionPerCustomer = roundTo(assumptions.price * (1 - assumptions.cogsRatio), 2);
  const grossMargin = roundTo(1 - assumptions.cogsRatio, 4);
  const breakEvenCustomers =
    contributionPerCustomer > 0 ? roundTo(monthlyFixed / contributionPerCustomer, 2) : null;

  const rows: MonthRow[] = [];
  let customers = assumptions.startingCustomers;
  let cash = roundTo(assumptions.openingCash - startupTotal, 2);
  let breakEvenMonth: number | null = null;
  let runwayMonth: number | null = cash < 0 ? 0 : null;

  for (let month = 1; month <= assumptions.horizon; month += 1) {
    if (month > 1) customers *= 1 + assumptions.monthlyGrowth;
    const revenue = roundTo(customers * assumptions.price, 2);
    const cogs = roundTo(revenue * assumptions.cogsRatio, 2);
    const grossProfit = roundTo(revenue - cogs, 2);
    const operatingProfit = roundTo(grossProfit - monthlyFixed, 2);
    cash = roundTo(cash + operatingProfit, 2);
    if (breakEvenMonth === null && operatingProfit >= 0) breakEvenMonth = month;
    if (runwayMonth === null && cash < 0) runwayMonth = month;
    rows.push({
      month,
      customers: roundTo(customers, 2),
      revenue,
      cogs,
      grossProfit,
      opex: monthlyFixed,
      operatingProfit,
      cashFlow: operatingProfit,
      cumulativeCash: cash,
    });
  }

  return {
    startupTotal,
    monthlyFixed,
    contributionPerCustomer,
    grossMargin,
    breakEvenCustomers,
    breakEvenMonth,
    runwayMonth,
    rows,
    endingCash: rows.at(-1)?.cumulativeCash ?? cash,
  };
}

export function financeToCsv(assumptions: Assumptions, projection: Projection) {
  const lines = [
    "month,customers,revenue,cogs,gross_profit,operating_expenses,operating_profit,cash_flow,cumulative_cash",
    ...projection.rows.map((row) =>
      [
        row.month,
        row.customers,
        row.revenue,
        row.cogs,
        row.grossProfit,
        row.opex,
        row.operatingProfit,
        row.cashFlow,
        row.cumulativeCash,
      ].join(","),
    ),
    "",
    "assumption,value",
    `price,${assumptions.price}`,
    `cogs_ratio,${assumptions.cogsRatio}`,
    `starting_customers,${assumptions.startingCustomers}`,
    `monthly_growth,${assumptions.monthlyGrowth}`,
    `horizon,${assumptions.horizon}`,
    `opening_cash,${assumptions.openingCash}`,
    `startup_total,${projection.startupTotal}`,
    `monthly_fixed,${projection.monthlyFixed}`,
    `break_even_customers,${projection.breakEvenCustomers ?? ""}`,
    `break_even_month,${projection.breakEvenMonth ?? ""}`,
  ];
  return `\uFEFF${lines.join("\n")}\n`;
}

export function scenariosToCsv(scenarios: { key: string; assumptions: Assumptions }[]) {
  const lines = ["scenario,month,customers,revenue,cogs,gross_profit,operating_expenses,operating_profit,cash_flow,cumulative_cash"];
  for (const scenario of scenarios) {
    const result = project(scenario.assumptions);
    for (const row of result.rows) {
      lines.push([scenario.key, row.month, row.customers, row.revenue, row.cogs, row.grossProfit, row.opex, row.operatingProfit, row.cashFlow, row.cumulativeCash].join(","));
    }
  }
  return `\uFEFF${lines.join("\n")}\n`;
}
