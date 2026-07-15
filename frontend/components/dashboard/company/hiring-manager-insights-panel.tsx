"use client";

import type { CandidateEvaluation } from "@/lib/ai-hiring";
import { isRejectionLanguage, splitToSentences } from "@/lib/utils";

type HiringManagerInsightsPanelProps = {
  evaluation: CandidateEvaluation;
  className?: string;
};

export function HiringManagerInsightsPanel({ evaluation, className }: HiringManagerInsightsPanelProps) {
  const showRecommendationLevel = !isRejectionLanguage(evaluation.recommendationLevel);
  const reasoningPoints = splitToSentences(evaluation.reasoning).filter((sentence) => !isRejectionLanguage(sentence));

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Hiring Intelligence Breakdown
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {evaluation.roleTemplateLabel} weight model · {evaluation.confidenceTier}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold leading-none text-primary-600 dark:text-primary-400">
            {evaluation.overallScore}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Confidence {evaluation.confidenceScore}%
            {showRecommendationLevel ? ` · ${evaluation.recommendationLevel}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {evaluation.scoreBreakdown.map((item) => (
          <div
            key={item.factor}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{item.rawScore}%</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Weight {item.weight}%</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Strengths
        </p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
          {evaluation.strengths.map((item) => (
            <li key={item} className="line-clamp-1">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {reasoningPoints.length > 0 ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800/40">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Top Contributors
          </p>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {evaluation.topContributors.join(" · ") || "Insufficient evidence"}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
            {reasoningPoints.map((sentence) => (
              <li key={sentence} className="line-clamp-2">
                {sentence}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
