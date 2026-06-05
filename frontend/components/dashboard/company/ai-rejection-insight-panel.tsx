"use client";

import type { RejectionReason } from "@/lib/ai-hiring";

type AiRejectionInsightPanelProps = {
  reason: RejectionReason;
};

export function AiRejectionInsightPanel({ reason }: AiRejectionInsightPanelProps) {
  if (!reason.sufficient) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
        {reason.overallSummary}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 text-xs dark:border-slate-700 dark:bg-slate-900/40">
      <p className="font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Rejection analysis</p>

      {reason.skillGaps.length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Skill gaps</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {reason.skillGaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Skill gaps: </span>
          <span className="text-slate-600 dark:text-slate-300">{reason.skillGapReason}</span>
        </p>
      )}

      {reason.projectRelevanceGaps.length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Project relevance gaps</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {reason.projectRelevanceGaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {reason.testPerformanceGaps.length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Test performance gaps</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {reason.testPerformanceGaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Tests / assessments: </span>
          <span className="text-slate-600 dark:text-slate-300">{reason.testPerformanceReason}</span>
        </p>
      )}

      {reason.experienceGaps.length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Experience gaps</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {reason.experienceGaps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          <span className="font-medium text-slate-700 dark:text-slate-200">Experience: </span>
          <span className="text-slate-600 dark:text-slate-300">{reason.experienceMismatchReason}</span>
        </p>
      )}

      {reason.actionableFeedback.length > 0 ? (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">Actionable feedback</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-slate-600 dark:text-slate-300">
            {reason.actionableFeedback.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-slate-700 dark:text-slate-200">{reason.overallSummary}</p>
    </div>
  );
}
