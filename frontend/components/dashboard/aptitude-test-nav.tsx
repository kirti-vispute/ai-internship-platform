"use client";

import { Clock, Lock, Play } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { APTITUDE_TEST_META } from "@/lib/data/aptitude-test-meta";
import {
  getAttemptCount,
  getBestScoreForTest,
  getRemainingAttempts,
  MAX_ATTEMPTS_PER_TEST
} from "@/lib/aptitude-progress";
import { cn } from "@/lib/utils";

type Props = {
  activeTestId: number | null;
  inExam: boolean;
  onStart: (testId: number) => void;
  canStart: (testId: number) => boolean;
  className?: string;
};

function SetCard({
  setId,
  title,
  durationMinutes,
  questionCount,
  active,
  attemptsUsed,
  locked,
  onAction
}: {
  setId: number;
  title: string;
  durationMinutes: number;
  questionCount: number;
  active: boolean;
  attemptsUsed: number;
  locked: boolean;
  onAction: () => void;
}) {
  const best = getBestScoreForTest(setId);

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-colors",
        active
          ? "border-sky-300/70 bg-sky-50/60 dark:border-sky-800/60 dark:bg-sky-950/30"
          : locked
            ? "border-slate-200/40 bg-slate-50/40 opacity-75 dark:border-slate-800/40 dark:bg-slate-900/20"
            : "border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-900/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        {best != null ? (
          <span className="text-[10px] tabular-nums text-slate-400">Best {best}</span>
        ) : null}
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
        <AppIcon icon={Clock} size="xs" />
        {durationMinutes} min · {questionCount} Q · Fullscreen
      </p>
      <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
        {attemptsUsed}/{MAX_ATTEMPTS_PER_TEST} attempts used
      </p>
      <button
        type="button"
        onClick={onAction}
        disabled={locked}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
      >
        {locked ? (
          <>
            <AppIcon icon={Lock} size="xs" />
            Locked
          </>
        ) : (
          <>
            <AppIcon icon={Play} size="xs" />
            {active ? "In progress" : "Start"}
          </>
        )}
      </button>
    </div>
  );
}

export function AptitudeTestNav({ activeTestId, inExam, onStart, canStart, className }: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="mb-3 hidden text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block dark:text-slate-500">
        Test Sets
      </p>
      {APTITUDE_TEST_META.map((set) => {
        const active = activeTestId === set.id && inExam;
        const attemptsUsed = getAttemptCount(set.id);
        const locked = !canStart(set.id);

        const handleClick = () => {
          if (locked || inExam) return;
          onStart(set.id);
        };

        return (
          <SetCard
            key={set.id}
            setId={set.id}
            title={set.title}
            durationMinutes={set.durationMinutes}
            questionCount={set.questionCount}
            active={active}
            attemptsUsed={attemptsUsed}
            locked={locked}
            onAction={handleClick}
          />
        );
      })}
    </div>
  );
}

export function AptitudeTestNavDropdown({ activeTestId, inExam, onStart, canStart }: Props) {
  const value = activeTestId ?? "";

  return (
    <select
      className="ds-input ds-select w-full text-sm lg:hidden"
      value={value}
      disabled={inExam}
      onChange={(e) => {
        const id = Number(e.target.value);
        if (!id || !canStart(id) || inExam) return;
        onStart(id);
      }}
      aria-label="Select aptitude test set"
    >
      <option value="" disabled>
        Select a test set
      </option>
      {APTITUDE_TEST_META.map((set) => {
        const remaining = getRemainingAttempts(set.id);
        const locked = !canStart(set.id);
        return (
          <option key={set.id} value={set.id} disabled={locked}>
            {set.title} · {set.durationMinutes} min · {locked ? "Locked" : `${remaining} left`}
          </option>
        );
      })}
    </select>
  );
}
