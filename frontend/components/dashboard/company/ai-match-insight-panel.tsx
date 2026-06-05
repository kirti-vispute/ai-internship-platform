"use client";

import type { CandidateEvaluation, MatchExplanation } from "@/lib/ai-hiring";
import { HiringManagerInsightsPanel } from "./hiring-manager-insights-panel";
import { ProjectInsightPanel } from "./project-insight-panel";

type AiMatchInsightPanelProps = {
  explanation: MatchExplanation;
  evaluation?: CandidateEvaluation;
};

export function AiMatchInsightPanel({ explanation, evaluation }: AiMatchInsightPanelProps) {
  if (!explanation.sufficient) {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        Insufficient data for AI analysis
      </div>
    );
  }

  const ranking = explanation.rankingExplanation;

  return (
    <div className="space-y-3 rounded-xl border border-primary-100 bg-primary-50/40 px-3 py-3 text-xs dark:border-primary-900/40 dark:bg-primary-950/20">
      <p className="font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
        Why this candidate was ranked
      </p>

      {evaluation ? <HiringManagerInsightsPanel evaluation={evaluation} /> : null}

      {!evaluation && ranking?.scoreBreakdown?.length ? (
        <p className="text-[var(--ds-muted)]">
          Rank #{ranking.rankedPosition} · Overall {ranking.overallScore}/100 · Confidence {ranking.confidenceScore}/100
        </p>
      ) : null}

      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">Strengths</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
          {(ranking?.strengths || explanation.skillAlignment).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      {(ranking?.weaknesses || []).length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Weaknesses</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {ranking?.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {ranking?.topContributors?.length ? (
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Top contributors: </span>
          <span className="text-slate-600 dark:text-slate-300">{ranking.topContributors.join(", ")}</span>
        </p>
      ) : null}

      <p>
        <span className="font-medium text-slate-700 dark:text-slate-200">Verified project relevance: </span>
        <span className="text-slate-600 dark:text-slate-300">{explanation.projectRelevance}</span>
      </p>

      <ProjectInsightPanel insights={explanation.projectInsights} confidenceWarning={explanation.projectConfidenceWarning} />

      <p>
        <span className="font-medium text-slate-700 dark:text-slate-200">Experience match: </span>
        <span className="text-slate-600 dark:text-slate-300">{explanation.experienceMatch}</span>
      </p>

      <p className="text-slate-700 dark:text-slate-200">{explanation.overallReasoning}</p>
    </div>
  );
}
