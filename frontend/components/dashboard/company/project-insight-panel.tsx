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
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {confidenceWarning}
        </div>
      ) : null}

      {!insights.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 px-3.5 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No verified project evidence available for explainable scoring yet.
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
            Why This Project Matters
          </p>
          {insights.map((insight, index) => (
            <div
              key={`${insight.whyItMatters}-${index}`}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/40"
            >
              <p className="line-clamp-1 text-sm font-medium text-slate-900 dark:text-slate-100">{insight.whyItMatters}</p>
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm text-slate-600 dark:text-slate-300">
                {insight.skillsDemonstrated.length > 0 ? (
                  <li className="line-clamp-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Skills: </span>
                    {insight.skillsDemonstrated.join(", ")}
                  </li>
                ) : null}
                <li className="line-clamp-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Complexity: </span>
                  {insight.complexityLevel}
                </li>
                {insight.notableFeatures.slice(0, 2).map((feature) => (
                  <li key={feature} className="line-clamp-1">
                    {feature}
                  </li>
                ))}
                <li className="line-clamp-1">{insight.scoreContribution}</li>
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
