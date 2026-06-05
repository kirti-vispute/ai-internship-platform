"use client";

import type { ProjectExplanation } from "@/lib/ai-hiring";

type ProjectInsightPanelProps = {
  insights: ProjectExplanation[];
  confidenceWarning?: string | null;
};

export function ProjectInsightPanel({ insights, confidenceWarning }: ProjectInsightPanelProps) {
  return (
    <div className="space-y-3">
      {confidenceWarning ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {confidenceWarning}
        </div>
      ) : null}

      {!insights.length ? (
        <div className="rounded-xl border border-dashed border-[var(--ds-border)] px-3 py-2.5 text-xs text-[var(--ds-muted)]">
          No verified project evidence available for explainable scoring yet.
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-300">Why this project matters</p>
          {insights.map((insight, index) => (
            <div
              key={`${insight.whyItMatters}-${index}`}
              className="rounded-xl border border-[var(--ds-border)] bg-white/[0.02] px-3 py-3 text-xs"
            >
              <p className="font-medium text-[var(--ds-text)]">{insight.whyItMatters}</p>
              {insight.skillsDemonstrated.length > 0 ? (
                <p className="mt-2 text-[var(--ds-muted)]">
                  <span className="font-medium text-[var(--ds-text-secondary,var(--ds-muted))]">Skills demonstrated: </span>
                  {insight.skillsDemonstrated.join(", ")}
                </p>
              ) : null}
              <p className="mt-1 text-[var(--ds-muted)]">
                <span className="font-medium text-[var(--ds-text-secondary,var(--ds-muted))]">Complexity: </span>
                {insight.complexityLevel}
              </p>
              {insight.notableFeatures.length > 0 ? (
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[var(--ds-muted)]">
                  {insight.notableFeatures.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[var(--ds-muted)]">{insight.scoreContribution}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
