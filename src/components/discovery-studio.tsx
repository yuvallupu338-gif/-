"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { useAutosave } from "@/components/use-autosave";
import { refreshAnalysisAction, saveAnalysisAction } from "@/server/actions";
import { text } from "@/lib/consultant/shared";
import type { Analysis, ProjectBundle } from "@/lib/domain";

export function DiscoveryStudio({ bundle }: { bundle: ProjectBundle }) {
  const locale = bundle.profile.locale;
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis>(bundle.analysis);
  const [message, setMessage] = useState<string | null>(null);
  const save = useAutosave(JSON.stringify(analysis), () => saveAnalysisAction(bundle.id, analysis));
  function updateList(key: "assumptions" | "strengths" | "weaknesses" | "customerProblems", value: string) {
    setAnalysis({ ...analysis, [key]: value.split("\n").map((line) => line.trim()).filter(Boolean) });
  }
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">{analysis.mode === "model" ? text(locale, "נוצר עם מודל", "Created with a model") : text(locale, "ניתוח ראשוני", "Preliminary analysis")}</p>
      <h1 className="mt-2 font-serif text-4xl">{text(locale, "גילוי", "Discovery")}</h1>
      <p className="mt-4 border border-line bg-surface p-4 text-sm leading-relaxed">{analysis.disclaimer}</p>
      <SaveNote status={save.status} error={save.error} locale={locale} />
      <label className="mt-8 block">
        <span className="mb-2 block text-sm text-muted">{text(locale, "ההזדמנות", "Opportunity")}</span>
        <Textarea value={analysis.opportunity} onChange={(event) => setAnalysis({ ...analysis, opportunity: event.target.value })} />
      </label>
      <ListField label={text(locale, "הנחות, שורה לכל הנחה", "Assumptions, one per line")} value={analysis.assumptions.join("\n")} onChange={(value) => updateList("assumptions", value)} />
      <ListField label={text(locale, "חוזקות", "Strengths")} value={analysis.strengths.join("\n")} onChange={(value) => updateList("strengths", value)} />
      <ListField label={text(locale, "חולשות", "Weaknesses")} value={analysis.weaknesses.join("\n")} onChange={(value) => updateList("weaknesses", value)} />
      <ListField label={text(locale, "בעיות לקוח", "Customer problems")} value={analysis.customerProblems.join("\n")} onChange={(value) => updateList("customerProblems", value)} />
      <label className="mt-6 block">
        <span className="mb-2 block text-sm text-muted">{text(locale, "הבחנה לבדיקה", "Differentiation to test")}</span>
        <Textarea value={analysis.differentiation} onChange={(event) => setAnalysis({ ...analysis, differentiation: event.target.value })} />
      </label>
      <div className="mt-8">
        <h2 className="font-serif text-2xl">{text(locale, "מודלי הכנסה", "Revenue models")}</h2>
        {analysis.revenueModels.map((model, index) => (
          <div key={index} className="mt-3 grid gap-2">
            <input className="h-11 border border-line bg-surface px-3" value={model.name} onChange={(event) => {
              const revenueModels = analysis.revenueModels.slice();
              revenueModels[index] = { ...model, name: event.target.value };
              setAnalysis({ ...analysis, revenueModels });
            }} />
            <Textarea value={model.description} onChange={(event) => {
              const revenueModels = analysis.revenueModels.slice();
              revenueModels[index] = { ...model, description: event.target.value };
              setAnalysis({ ...analysis, revenueModels });
            }} />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h2 className="font-serif text-2xl">{text(locale, "סיכונים", "Risks")}</h2>
        {analysis.risks.map((risk, index) => (
          <div key={index} className="mt-3 grid gap-2">
            <input
              className="h-11 border border-line bg-surface px-3"
              aria-label={text(locale, "כותרת סיכון", "Risk title")}
              value={risk.title}
              onChange={(event) => {
                const risks = analysis.risks.slice();
                risks[index] = { ...risk, title: event.target.value };
                setAnalysis({ ...analysis, risks });
              }}
            />
            <Textarea
              aria-label={text(locale, "פירוט הסיכון", "Risk detail")}
              value={risk.detail}
              onChange={(event) => {
                const risks = analysis.risks.slice();
                risks[index] = { ...risk, detail: event.target.value };
                setAnalysis({ ...analysis, risks });
              }}
            />
            <Textarea
              aria-label={text(locale, "צעד בדיקה", "Check to run")}
              value={risk.mitigation}
              onChange={(event) => {
                const risks = analysis.risks.slice();
                risks[index] = { ...risk, mitigation: event.target.value };
                setAnalysis({ ...analysis, risks });
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-8">
        {analysis.mode === "preliminary" ? (
          <Button type="button" variant="outline" onClick={async () => {
            const result = await refreshAnalysisAction(bundle.id);
            setMessage(result.ok ? text(locale, "הניתוח הראשוני רוענן.", "The preliminary analysis was refreshed.") : result.error);
            if (result.ok) router.refresh();
          }}>{text(locale, "רענון הניתוח הראשוני", "Refresh the preliminary analysis")}</Button>
        ) : <p className="text-sm text-muted">{text(locale, "הניתוח סומן כנוצר במודל ולא יוחלף ברענון ראשוני.", "This analysis is marked as model-created and will not be replaced by a preliminary refresh.")}</p>}
        {message && <p className="mt-3 text-sm">{message}</p>}
      </div>
    </div>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="mt-6 block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SaveNote({ status, error, locale }: { status: string; error: string | null; locale: ProjectBundle["profile"]["locale"] }) {
  const label = status === "saving" ? text(locale, "שומר", "Saving") : status === "saved" ? text(locale, "נשמר", "Saved") : status === "error" ? error : "";
  return label ? <p className="mt-4 text-sm text-muted" role="status">{label}</p> : null;
}
