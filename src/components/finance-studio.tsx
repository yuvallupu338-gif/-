"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SaveNote } from "@/components/discovery-studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { saveScenarioAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { Assumptions, FinanceScenario, LineItem, ProjectBundle } from "@/lib/domain";
import { project } from "@/lib/finance";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { uid } from "@/lib/utils";

export function FinanceStudio({ bundle }: { bundle: ProjectBundle }) {
  const locale = bundle.profile.locale;
  const currency = bundle.profile.currency;
  const [scenarios, setScenarios] = useState(bundle.scenarios);
  const [key, setKey] = useState<FinanceScenario["key"]>("base");
  const scenario = scenarios.find((item) => item.key === key) ?? scenarios[0];
  const result = useMemo(() => project(scenario.assumptions), [scenario]);
  const save = useAutosave(JSON.stringify(scenario), () => saveScenarioAction(bundle.id, scenario.key, scenario.assumptions));
  function patch(partial: Partial<Assumptions>) {
    setScenarios(scenarios.map((item) => item.key === scenario.key ? { ...item, assumptions: { ...item.assumptions, ...partial } } : item));
  }
  function patchItem(list: "startupItems" | "monthlyItems", id: string, partial: Partial<LineItem>) {
    patch({ [list]: scenario.assumptions[list].map((item) => item.id === id ? { ...item, ...partial, source: "input" } : item) });
  }
  const money = (value: number) => formatMoney(value, currency, locale);
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-serif text-4xl">{text(locale, "מודל פיננסי", "Financial model")}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">{scenario.assumptions.notes}</p>
      <SaveNote status={save.status} error={save.error} locale={locale} />
      <div className="mt-4 flex gap-2">
        {scenarios.map((item) => (
          <Button key={item.key} type="button" size="sm" variant={item.key === scenario.key ? "primary" : "outline"} onClick={() => setKey(item.key)}>{item.name}</Button>
        ))}
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Stat label={text(locale, "עלויות הקמה", "Startup costs")} value={money(result.startupTotal)} hint={text(locale, "הערכה שמסתכמת לתקציב", "Estimate that adds up to the budget")} />
        <Stat label={text(locale, "הוצאה חודשית", "Monthly cost")} value={money(result.monthlyFixed)} hint={text(locale, "הערכה", "Estimate")} />
        <Stat label={text(locale, "שולי רווח גולמי", "Gross margin")} value={formatPercent(result.grossMargin, locale)} hint={text(locale, "1 פחות יחס עלות המכר", "1 minus the cost ratio")} />
        <Stat label={text(locale, "לקוחות לאיזון", "Customers to break even")} value={result.breakEvenCustomers === null ? "—" : formatNumber(result.breakEvenCustomers, locale, 1)} hint={result.breakEvenMonth ? text(locale, `חודש ${result.breakEvenMonth}`, `Month ${result.breakEvenMonth}`) : text(locale, "אין איזון בטווח", "No break-even in range")} />
      </div>
      <div className="mt-6 h-72 border border-line bg-surface p-3" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.rows}>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} />
            <YAxis stroke="var(--muted)" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" name={text(locale, "הכנסה", "Revenue")} stroke="var(--ink)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="opex" name={text(locale, "הוצאה", "Cost")} stroke="var(--muted)" dot={false} />
            <Line type="monotone" dataKey="cumulativeCash" name={text(locale, "מזומן מצטבר", "Cumulative cash")} stroke="var(--ok)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Lines title={text(locale, "עלויות הקמה", "Startup costs")} items={scenario.assumptions.startupItems} onChange={(id, partial) => patchItem("startupItems", id, partial)} onAdd={() => patch({ startupItems: [...scenario.assumptions.startupItems, { id: uid(), name: text(locale, "פריט", "Item"), amount: 0, source: "input" }] })} locale={locale} />
        <Lines title={text(locale, "הוצאה חודשית", "Monthly cost")} items={scenario.assumptions.monthlyItems} onChange={(id, partial) => patchItem("monthlyItems", id, partial)} onAdd={() => patch({ monthlyItems: [...scenario.assumptions.monthlyItems, { id: uid(), name: text(locale, "פריט", "Item"), amount: 0, source: "input" }] })} locale={locale} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <NumberField label={text(locale, "מחיר ליחידה", "Price per unit")} value={scenario.assumptions.price} onChange={(price) => patch({ price })} />
        <NumberField label={text(locale, "יחס עלות מכר", "Cost ratio")} value={scenario.assumptions.cogsRatio} step="0.01" onChange={(cogsRatio) => patch({ cogsRatio })} />
        <NumberField label={text(locale, "לקוחות בחודש הראשון", "Customers in month one")} value={scenario.assumptions.startingCustomers} onChange={(startingCustomers) => patch({ startingCustomers })} />
        <NumberField label={text(locale, "צמיחה חודשית", "Monthly growth")} value={scenario.assumptions.monthlyGrowth} step="0.01" onChange={(monthlyGrowth) => patch({ monthlyGrowth })} />
        <NumberField label={text(locale, "חודשים", "Months")} value={scenario.assumptions.horizon} onChange={(horizon) => patch({ horizon })} />
        <NumberField label={text(locale, "מזומן פותח", "Opening cash")} value={scenario.assumptions.openingCash} onChange={(openingCash) => patch({ openingCash, openingCashSource: "input" })} />
      </div>
      <p className="mt-3 text-xs text-muted">{scenario.assumptions.openingCashSource === "input" ? text(locale, "המזומן הפותח סומן כנתון.", "Opening cash is marked as entered.") : text(locale, "המזומן הפותח הוא הערכה.", "Opening cash is an estimate.")} {text(locale, "רווח תפעולי בחודש האחרון:", "Operating profit in the last month:")} <span className="num">{money(result.rows.at(-1)?.operatingProfit ?? 0)}</span></p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return <div className="border border-line bg-surface p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 font-serif text-2xl num">{value}</p><p className="mt-1 text-xs text-muted">{hint}</p></div>;
}

function Lines({ title, items, onChange, onAdd, locale }: { title: string; items: LineItem[]; onChange: (id: string, partial: Partial<LineItem>) => void; onAdd: () => void; locale: ProjectBundle["profile"]["locale"] }) {
  return (
    <div>
      <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{title}</h2><Button type="button" size="sm" variant="outline" onClick={onAdd}>{text(locale, "שורה", "Row")}</Button></div>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_8rem_auto] gap-2">
            <Input value={item.name} onChange={(event) => onChange(item.id, { name: event.target.value })} />
            <Input className="num" type="number" value={item.amount} onChange={(event) => onChange(item.id, { amount: Number(event.target.value) })} />
            <span className="self-center text-xs text-muted">{item.source === "input" ? text(locale, "נתון", "Entered") : text(locale, "הערכה", "Estimate")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, step = "1" }: { label: string; value: number; onChange: (value: number) => void; step?: string }) {
  return <label className="text-sm text-muted">{label}<Input className="mt-1 num" type="number" step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
