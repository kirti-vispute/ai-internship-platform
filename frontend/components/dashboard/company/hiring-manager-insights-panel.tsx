"use client";

import type { CandidateEvaluation } from "@/lib/ai-hiring";

type HiringManagerInsightsPanelProps = {
  evaluation: CandidateEvaluation;
  className?: string;
};

export function HiringManagerInsightsPanel({ evaluation, className }: HiringManagerInsightsPanelProps) {
  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="ds-label">Hiring Intelligence Breakdown</p>
          <p className="ds-caption">{evaluation.roleTemplateLabel} weight model · {evaluation.confidenceTier}</p>
        </div>
        <div className="text-right">
          <p className="ds-stat-value text-primary-300">{evaluation.overallScore}%</p>
          <p className="ds-caption">Confidence {evaluation.confidenceScore}% · {evaluation.recommendationLevel}</p>
        </div>
      </div>

      <div className="company-dashboard-metric-grid sm:grid-cols-2 lg:grid-cols-5">
        {evaluation.scoreBreakdown.map((item) => (
          <div key={item.factor} className="company-dashboard-metric-tile">
            <p className="ds-label">{item.label}</p>
            <p className="ds-stat-value mt-1">{item.rawScore}%</p>
            <p className="ds-caption mt-1">
              Weight {item.weight}% · Contribution {item.weightedContribution}%
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="company-dashboard-panel-card">
          <p className="ds-label text-emerald-300">Strengths</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--ds-muted)]">
            {evaluation.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="company-dashboard-panel-card">
          <p className="ds-label text-amber-300">Weaknesses</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[var(--ds-muted)]">
            {evaluation.weaknesses.length ? evaluation.weaknesses.map((item) => <li key={item}>{item}</li>) : <li>No major weaknesses flagged.</li>}
          </ul>
        </div>
      </div>

      <div className="company-dashboard-panel-card mt-4">
        <p className="ds-label">Top Contributors</p>
        <p className="ds-body mt-2">{evaluation.topContributors.join(" · ") || "Insufficient evidence"}</p>
        <p className="ds-caption mt-3">{evaluation.reasoning}</p>
      </div>
    </div>
  );
}
