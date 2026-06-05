"use client";

import { AptitudeAttemptChart } from "@/components/dashboard/aptitude-attempt-chart";
import { AiConfidenceBadge } from "@/components/dashboard/ai-confidence-badge";
import { APTITUDE_SECTIONS } from "@/lib/data/aptitude-tests";
import { AptitudeProgressCharts } from "@/components/dashboard/aptitude-progress-charts";
import { buildProgressData, getAttemptHistory, getAptitudeHistory } from "@/lib/aptitude-progress";
import { formatDuration, type AptitudeTestResult } from "@/lib/aptitude-test-engine";
import { cn } from "@/lib/utils";

const READINESS_STYLES: Record<AptitudeTestResult["readinessLabel"], string> = {
  "Not Ready": "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40",
  "Needs Improvement": "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40",
  "Interview Ready (Moderate)": "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40",
  "Highly Interview Ready": "text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-950/40"
};

const RISK_STYLES = {
  Low: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800",
  Medium: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40",
  High: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40"
};

const FLAG_LABELS: Record<string, string> = {
  tab_switching: "Tab switches detected",
  focus_loss: "Window focus changes",
  inactivity: "Extended inactivity",
  copy_attempt: "Copy action in test area",
  fullscreen_exit: "Fullscreen was exited before submit"
};

type Props = {
  result: AptitudeTestResult;
  onBack: () => void;
  onRetake: () => void;
  canRetake?: boolean;
};

export function AptitudeResultView({ result, onBack, onRetake, canRetake = true }: Props) {
  const progressData = buildProgressData(getAptitudeHistory());
  const attemptHistory = getAttemptHistory(result.testId);
  const report = result.cheatingReport;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{result.testTitle} — Results</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Attempt {result.attemptNumber ?? attemptHistory.length} · score · readiness · behavior summary
          </p>
          {result.autoSubmitted ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Auto-submitted when the session ended
              {report?.flags.includes("fullscreen_exit") ? " (fullscreen exit)" : ""}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300"
          >
            All Sets
          </button>
          <button
            type="button"
            onClick={onRetake}
            disabled={!canRetake}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {canRetake ? "Retake" : "No attempts left"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Score" value={`${result.totalScore}/${result.maxScore}`} />
        <StatCard label="Accuracy" value={`${result.accuracy}%`} />
        <StatCard label="Time Efficiency" value={`${result.timeEfficiency}%`} />
        <StatCard
          label="Time Used"
          value={formatDuration(result.timeSpentSeconds)}
          sub={`of ${formatDuration(result.timeAllowedSeconds)}`}
        />
      </div>

      <AiConfidenceBadge
        confidenceScore={result.aiValidation.confidenceScore}
        validationStatus={result.aiValidation.validationStatus}
        confidenceTier={result.aiValidation.confidenceTier}
        explanationTrace={result.aiValidation.explanationTrace}
      />

      <div className="rounded-xl border border-slate-200/60 p-5 dark:border-slate-800/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Interview Readiness Score</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Performance 40% · Sections 20% · Difficulty 15% · Time 15% · Trend 10%
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{result.readinessScore}/100</p>
            <span
              className={cn(
                "mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-semibold",
                READINESS_STYLES[result.readinessLabel]
              )}
            >
              {result.readinessLabel}
            </span>
          </div>
        </div>
      </div>

      {report ? (
        <Panel title="Session Behavior Summary">
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Neutral activity log from your proctored session — not a judgment of intent.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Tab switches" value={String(report.behaviorLog.tabSwitchCount)} />
            <StatCard
              label="Time outside tab"
              value={formatDuration(report.behaviorLog.focusLossDurationSeconds)}
            />
            <div className="rounded-xl border border-slate-200/60 px-4 py-3 dark:border-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Activity level</p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {report.cheatingRiskLevel}
              </p>
              <span
                className={cn(
                  "mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-medium",
                  RISK_STYLES[report.cheatingRiskLevel]
                )}
              >
                Score {report.cheatingScore}/100
              </span>
            </div>
          </div>
          {report.flags.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {report.flags.map((flag) => (
                <li key={flag}>• {FLAG_LABELS[flag] ?? flag}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No notable activity flags recorded.</p>
          )}
        </Panel>
      ) : null}

      {attemptHistory.length > 0 ? (
        <Panel title="Attempt Performance Trend">
          <AptitudeAttemptChart attempts={attemptHistory} maxScore={result.maxScore} />
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Weak Areas">
          {result.weakAreas.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No weak sections detected.</p>
          ) : (
            <ul className="space-y-2">
              {result.weakAreas.map((area) => (
                <li
                  key={area.section}
                  className="rounded-lg border border-rose-200/60 bg-rose-50/30 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/20"
                >
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {area.label} → Weak ({area.accuracy}% accuracy)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{area.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Strong Areas">
          {result.strongAreas.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Build consistency to unlock strong sections.</p>
          ) : (
            <ul className="space-y-2">
              {result.strongAreas.map((area) => (
                <li
                  key={area.section}
                  className="rounded-lg border border-emerald-200/60 bg-emerald-50/30 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                >
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {area.label} → Strong ({area.accuracy}% accuracy)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Section Breakdown">
        <div className="grid gap-2 sm:grid-cols-2">
          {APTITUDE_SECTIONS.map((section) => {
            const stat = result.sectionScores[section.key];
            return (
              <div key={section.key} className="rounded-lg border border-slate-200/60 px-3 py-2 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{section.shortLabel}</span>
                  <span className="tabular-nums text-slate-600 dark:text-slate-300">
                    {stat.score}/{stat.max}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.accuracy}% acc · {formatDuration(stat.timeSpentSeconds)} used
                </p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Personalized Insight">
        <p className="rounded-lg bg-sky-50/60 px-3 py-2 text-sm text-sky-800 dark:bg-sky-950/30 dark:text-sky-200">
          <span className="font-semibold">Suggestion: </span>
          {result.personalizedInsight.suggestion}
        </p>
      </Panel>

      {progressData.length > 1 ? (
        <Panel title="Progress Over Time">
          <AptitudeProgressCharts data={progressData} />
        </Panel>
      ) : null}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200/60 p-4 dark:border-slate-800/60">
      <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h4>
      {children}
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 px-4 py-3 dark:border-slate-800/60">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
      {sub ? <p className="text-[11px] text-slate-400">{sub}</p> : null}
    </div>
  );
}
