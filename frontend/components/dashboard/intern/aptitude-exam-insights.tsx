"use client";

import { APTITUDE_SECTIONS } from "@/lib/data/aptitude-tests";
import { formatDuration, getQuestionsForSection, MARKS, type AptitudeSectionKey } from "@/lib/aptitude-test-engine";
import type { AptitudeTestSet } from "@/lib/data/aptitude-tests";
import { cn } from "@/lib/utils";

type Props = {
  test: AptitudeTestSet;
  answers: Record<string, number | null>;
  sectionSpent: Record<AptitudeSectionKey, number>;
  currentSection: AptitudeSectionKey;
  remainingSeconds: number;
  collapsed?: boolean;
  onToggle?: () => void;
};

function liveScore(test: AptitudeTestSet, answers: Record<string, number | null>): number {
  let score = 0;
  for (const q of test.questions) {
    const selected = answers[q.id];
    if (selected == null || selected < 0) continue;
    const marks = q.marks ?? MARKS[q.difficulty];
    if (selected === q.correctIndex) score += marks;
    else score -= q.difficulty === "Hard" ? 0.5 : 0.25;
  }
  return Math.max(0, Math.round(score * 100) / 100);
}

export function AptitudeExamInsights({
  test,
  answers,
  sectionSpent,
  currentSection,
  remainingSeconds,
  collapsed,
  onToggle
}: Props) {
  const score = liveScore(test, answers);
  const maxScore = test.questions.reduce((s, q) => s + (q.marks ?? MARKS[q.difficulty]), 0);
  const timeUsed = test.durationMinutes * 60 - remainingSeconds;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 md:max-lg:mb-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
          Insights
        </p>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] font-medium text-[var(--ds-muted)] lg:hidden"
          >
            {collapsed ? "Show" : "Hide"}
          </button>
        ) : null}
      </div>

      <div className={cn(collapsed && "hidden md:max-lg:hidden", "space-y-4")}>
        <div className="rounded-lg border border-[var(--ds-border)] px-3 py-2">
          <p className="text-[11px] text-[var(--ds-muted)]">Live score</p>
          <p className="text-lg font-semibold tabular-nums text-[var(--ds-text)]">
            {score}/{maxScore}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--ds-border)] px-3 py-2">
          <p className="text-[11px] text-[var(--ds-muted)]">Time spent</p>
          <p className="text-sm font-medium tabular-nums text-[var(--ds-text)]">
            {formatDuration(timeUsed)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-medium text-[var(--ds-muted)]">Sections</p>
          {APTITUDE_SECTIONS.map((section) => {
            const qs = getQuestionsForSection(test, section.key);
            const done = qs.filter((q) => answers[q.id] != null).length;
            const active = section.key === currentSection;
            return (
              <div
                key={section.key}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1.5 text-xs",
                  active ? "bg-[var(--ds-info-bg)]" : ""
                )}
              >
                <span className="font-medium text-[var(--ds-text-secondary)]">{section.shortLabel}</span>
                <span className="tabular-nums text-[var(--ds-muted)]">
                  {done}/{qs.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
