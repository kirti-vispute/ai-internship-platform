"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Clock, Eraser, Flag } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { computeCheatingReport } from "@/lib/aptitude-proctor";
import { APTITUDE_SECTIONS } from "@/lib/data/aptitude-tests";
import type { AptitudeExamSession } from "@/lib/aptitude-progress";
import { saveExamSession } from "@/lib/aptitude-progress";
import {
  formatDuration,
  getQuestionsForSection,
  getSectionMeta,
  type AptitudeSectionKey
} from "@/lib/aptitude-test-engine";
import type { AptitudeQuestion, AptitudeTestSet } from "@/lib/data/aptitude-tests";
import { useAptitudeProctor } from "@/lib/use-aptitude-proctor";
import { cn } from "@/lib/utils";

const SECTION_ORDER: AptitudeSectionKey[] = ["quantitative", "logical", "verbal", "dataInterpretation"];

export type ExamStateSnapshot = {
  answers: Record<string, number | null>;
  sectionSpent: Record<AptitudeSectionKey, number>;
  currentSection: AptitudeSectionKey;
  remainingSeconds: number;
  globalQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
};

type SubmitOptions = {
  autoSubmitted?: boolean;
  fullscreenExit?: boolean;
};

type Props = {
  test: AptitudeTestSet;
  initialSession?: AptitudeExamSession | null;
  fullscreenMode?: boolean;
  examEnabled?: boolean;
  onSubmit: (
    answers: Record<string, number | null>,
    timeSpentSeconds: number,
    sectionTimeSpent: Record<AptitudeSectionKey, number>,
    options?: SubmitOptions
  ) => void;
  onStateChange?: (snapshot: ExamStateSnapshot) => void;
  onSessionPersist?: (session: AptitudeExamSession) => void;
};

function defaultSectionRemaining(test: AptitudeTestSet) {
  return Object.fromEntries(
    APTITUDE_SECTIONS.map((s) => [s.key, test.sectionTimeMinutes[s.key] * 60])
  ) as Record<AptitudeSectionKey, number>;
}

function defaultSectionSpent() {
  return Object.fromEntries(SECTION_ORDER.map((k) => [k, 0])) as Record<AptitudeSectionKey, number>;
}

function buildFlatQuestions(test: AptitudeTestSet): AptitudeQuestion[] {
  return SECTION_ORDER.flatMap((section) => getQuestionsForSection(test, section));
}

function resolveQuestionPosition(
  test: AptitudeTestSet,
  globalIndex: number
): { section: AptitudeSectionKey; localIndex: number; question: AptitudeQuestion } | null {
  const flat = buildFlatQuestions(test);
  const question = flat[globalIndex];
  if (!question) return null;
  const localIndex = getQuestionsForSection(test, question.section).findIndex((q) => q.id === question.id);
  return { section: question.section, localIndex: Math.max(0, localIndex), question };
}

function globalIndexFromSession(test: AptitudeTestSet, section: AptitudeSectionKey, localIndex: number): number {
  let offset = 0;
  for (const key of SECTION_ORDER) {
    if (key === section) return offset + localIndex;
    offset += getQuestionsForSection(test, key).length;
  }
  return 0;
}

export function AptitudeExamView({
  test,
  initialSession,
  fullscreenMode = false,
  examEnabled = true,
  onSubmit,
  onStateChange,
  onSessionPersist
}: Props) {
  const examRootRef = useRef<HTMLDivElement>(null);
  const flatQuestions = useMemo(() => buildFlatQuestions(test), [test]);

  const initialGlobalIndex = initialSession
    ? globalIndexFromSession(test, initialSession.currentSection, initialSession.currentIndex)
    : 0;

  const [answers, setAnswers] = useState<Record<string, number | null>>(() => initialSession?.answers ?? {});
  const [globalQuestionIndex, setGlobalQuestionIndex] = useState(initialGlobalIndex);
  const [markedIds, setMarkedIds] = useState<Set<string>>(
    () => new Set(initialSession?.markedQuestionIds ?? [])
  );
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialSession?.remainingSeconds ?? test.durationMinutes * 60
  );
  const [sectionSpent, setSectionSpent] = useState<Record<AptitudeSectionKey, number>>(
    () => initialSession?.sectionTimeSpentSeconds ?? defaultSectionSpent()
  );
  const [sectionRemaining, setSectionRemaining] = useState<Record<AptitudeSectionKey, number>>(
    () => initialSession?.sectionRemainingSeconds ?? defaultSectionRemaining(test)
  );
  const [submitted, setSubmitted] = useState(false);

  const answersRef = useRef(answers);
  const sectionSpentRef = useRef(sectionSpent);
  const globalIndexRef = useRef(globalQuestionIndex);
  const submittedRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  const remainingSecondsRef = useRef(remainingSeconds);
  useEffect(() => {
    remainingSecondsRef.current = remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const { proctorLog, proctorRef } = useAptitudeProctor({
    enabled: !submitted && examEnabled,
    examRootRef,
    initialLog: initialSession?.proctorLog
  });

  const position = resolveQuestionPosition(test, globalQuestionIndex);
  const currentQuestion = position?.question;
  const currentSection = position?.section ?? "quantitative";

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    sectionSpentRef.current = sectionSpent;
  }, [sectionSpent]);

  useEffect(() => {
    globalIndexRef.current = globalQuestionIndex;
  }, [globalQuestionIndex]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const answeredCount = test.questions.filter((q) => answers[q.id] != null).length;
  const totalQuestions = flatQuestions.length;

  const buildSession = useCallback((): AptitudeExamSession => {
    const pos = resolveQuestionPosition(test, globalQuestionIndex);
    const log = proctorRef.current;
    return {
      testActive: !submittedRef.current,
      fullscreenMode: initialSession?.fullscreenMode ?? true,
      isFullscreenLocked: initialSession?.isFullscreenLocked ?? true,
      testId: test.id,
      attemptNumber: initialSession?.attemptNumber ?? 1,
      startTime: initialSession?.startTime ?? new Date().toISOString(),
      fullscreenEnteredAt: initialSession?.fullscreenEnteredAt,
      answers: answersRef.current,
      currentSection: pos?.section ?? "quantitative",
      currentIndex: pos?.localIndex ?? 0,
      sectionStartedAt: initialSession?.sectionStartedAt ?? new Date().toISOString(),
      remainingSeconds,
      sectionRemainingSeconds: sectionRemaining,
      sectionTimeSpentSeconds: sectionSpentRef.current,
      unlockedSections: SECTION_ORDER,
      tabSwitchCount: log.tabSwitchCount,
      focusLossEvents: log.focusLossEvents,
      proctorLog: log,
      markedQuestionIds: Array.from(markedIds)
    };
  }, [globalQuestionIndex, initialSession, markedIds, remainingSeconds, sectionRemaining, test.id]);

  const persistSession = useCallback(() => {
    const session = buildSession();
    saveExamSession(session);
    onSessionPersist?.(session);
  }, [buildSession, onSessionPersist]);

  useEffect(() => {
    persistSession();
  }, [persistSession, proctorLog]);

  useEffect(() => {
    onStateChange?.({
      answers,
      sectionSpent,
      currentSection,
      remainingSeconds,
      globalQuestionIndex,
      totalQuestions,
      answeredCount
    });
  }, [
    answeredCount,
    answers,
    currentSection,
    globalQuestionIndex,
    onStateChange,
    remainingSeconds,
    sectionSpent,
    totalQuestions
  ]);

  const finalizeSubmit = useCallback((autoSubmitted = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    const spent = Math.max(1, test.durationMinutes * 60 - remainingSecondsRef.current);
    onSubmitRef.current(answersRef.current, spent, sectionSpentRef.current, { autoSubmitted });
  }, [test.durationMinutes]);

  useEffect(() => {
    if (submitted || !examEnabled) return;

    const timer = window.setInterval(() => {
      const section = resolveQuestionPosition(test, globalIndexRef.current)?.section ?? "quantitative";

      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          finalizeSubmit(true);
          return 0;
        }
        return seconds - 1;
      });

      setSectionRemaining((prev) => ({
        ...prev,
        [section]: Math.max(0, prev[section] - 1)
      }));
      setSectionSpent((prev) => ({ ...prev, [section]: prev[section] + 1 }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examEnabled, finalizeSubmit, submitted, test]);

  const handleSubmit = () => finalizeSubmit(false);

  const handleSelect = (optionIndex: number) => {
    if (!currentQuestion || submitted || !examEnabled) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const handleMarkReview = () => {
    if (!currentQuestion) return;
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
  };

  const handleClearAnswer = () => {
    if (!currentQuestion || submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: null }));
  };

  if (!currentQuestion || !position) return null;

  const sectionMeta = getSectionMeta(currentSection);
  const isMarked = markedIds.has(currentQuestion.id);
  const cheatingPreview = computeCheatingReport(proctorLog);

  return (
    <div
      ref={examRootRef}
      className={cn(
        "relative flex flex-col overflow-hidden bg-white dark:bg-slate-950/40",
        fullscreenMode
          ? "h-full min-h-0"
          : "h-[min(680px,calc(100dvh-14rem))] min-h-[480px] rounded-xl border border-slate-200/60 dark:border-slate-800/60"
      )}
    >
      {!examEnabled ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 dark:bg-slate-950/90">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Fullscreen required to continue</p>
        </div>
      ) : null}
      <header className="sticky top-0 z-10 shrink-0 border-b border-slate-200/70 bg-white px-4 py-3 dark:border-slate-800/70 dark:bg-slate-950/95 lg:static">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {sectionMeta.shortLabel}
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Question {globalQuestionIndex + 1} / {totalQuestions}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold tabular-nums",
                remainingSeconds < 300
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              )}
            >
              <AppIcon icon={Clock} size="xs" />
              {formatDuration(remainingSeconds)}
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitted || !examEnabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              <AppIcon icon={Flag} size="xs" />
              Submit
            </button>
          </div>
        </div>
        {cheatingPreview.behaviorLog.tabSwitchCount > 0 || fullscreenMode ? (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
            Fullscreen locked · Esc exits and auto-submits your attempt
          </p>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <article className="mx-auto max-w-2xl">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {currentQuestion.difficulty}
            </span>
            {isMarked ? (
              <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Marked for review</span>
            ) : null}
          </div>
          <p className="text-base font-medium leading-relaxed text-slate-900 dark:text-slate-50">
            {currentQuestion.question}
          </p>
          <div className="mt-4 space-y-2">
            {currentQuestion.options.map((option, idx) => {
              const selected = answers[currentQuestion.id] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={submitted || !examEnabled}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                    selected
                      ? "border-sky-400/70 bg-sky-50/80 dark:border-sky-700 dark:bg-sky-950/30"
                      : "border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40"
                  )}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-slate-800 dark:text-slate-100">{option}</span>
                </button>
              );
            })}
          </div>
        </article>
      </div>

      <footer className="shrink-0 border-t border-slate-200/70 px-4 py-3 dark:border-slate-800/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={globalQuestionIndex <= 0 || submitted || !examEnabled}
              onClick={() => setGlobalQuestionIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-slate-200/70 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={globalQuestionIndex >= totalQuestions - 1 || submitted || !examEnabled}
              onClick={() => setGlobalQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              className="rounded-lg border border-slate-200/70 px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
            >
              Next
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarkReview}
              disabled={submitted || !examEnabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
                isMarked
                  ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <AppIcon icon={Bookmark} size="xs" />
              Mark
            </button>
            <button
              type="button"
              onClick={handleClearAnswer}
              disabled={submitted || !examEnabled}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <AppIcon icon={Eraser} size="xs" />
              Clear
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
