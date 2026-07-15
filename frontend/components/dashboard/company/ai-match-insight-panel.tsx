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
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        Insufficient data for AI analysis.
      </div>
    );
  }

  const ranking = explanation.rankingExplanation;

  // When a full evaluation is available, HiringManagerInsightsPanel already covers
  // score breakdown, strengths, top contributors, and reasoning — so this panel only
  // adds the facts it doesn't duplicate (project relevance + experience, condensed).
  const experienceMatchLine =
    explanation.experienceMatch && explanation.experienceMatch !== explanation.overallReasoning
      ? explanation.experienceMatch
      : null;

  // Skip the project-relevance bullet when it's just restating the confidence warning
  // banner that ProjectInsightPanel already renders below.
  const projectRelevanceLine =
    explanation.projectRelevance && explanation.projectRelevance !== explanation.projectConfidenceWarning
      ? explanation.projectRelevance
      : null;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
        Why This Candidate Was Ranked
      </p>

      {evaluation ? <HiringManagerInsightsPanel evaluation={evaluation} /> : null}

      {!evaluation ? (
        <div className="space-y-3">
          {ranking?.scoreBreakdown?.length ? (
            <p className="text-slate-500 dark:text-slate-400">
              Rank #{ranking.rankedPosition} · Overall {ranking.overallScore}/100 · Confidence {ranking.confidenceScore}
              /100
            </p>
          ) : null}

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Strengths
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-slate-700 dark:text-slate-300">
              {(ranking?.strengths || explanation.skillAlignment).map((item) => (
                <li key={item} className="line-clamp-1">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {ranking?.topContributors?.length ? (
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-700 dark:text-slate-200">Top contributors: </span>
              {ranking.topContributors.join(", ")}
            </p>
          ) : null}
        </div>
      ) : null}

      {projectRelevanceLine || experienceMatchLine ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/40">
          <ul className="list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-300">
            {projectRelevanceLine ? (
              <li className="line-clamp-2">
                <span className="font-medium text-slate-700 dark:text-slate-200">Project relevance: </span>
                {projectRelevanceLine}
              </li>
            ) : null}
            {experienceMatchLine ? (
              <li className="line-clamp-2">
                <span className="font-medium text-slate-700 dark:text-slate-200">Experience match: </span>
                {experienceMatchLine}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <ProjectInsightPanel insights={explanation.projectInsights} confidenceWarning={explanation.projectConfidenceWarning} />
    </div>
  );
}
