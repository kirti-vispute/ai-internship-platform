"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InterviewScheduleSlot } from "@/lib/ai-hiring";

const INTERVIEW_TYPES = ["Technical Round", "HR Round", "Final Round"] as const;

type InterviewScheduleModalProps = {
  open: boolean;
  candidateName?: string;
  saving?: boolean;
  mode?: "schedule" | "reschedule";
  initialSlot?: Partial<InterviewScheduleSlot>;
  overlapWarning?: string | null;
  onClose: () => void;
  onConfirm: (slot: InterviewScheduleSlot) => void | Promise<void>;
};

export function InterviewScheduleModal({
  open,
  candidateName,
  saving = false,
  mode = "schedule",
  initialSlot,
  overlapWarning,
  onClose,
  onConfirm
}: InterviewScheduleModalProps) {
  const [roundType, setRoundType] = useState<(typeof INTERVIEW_TYPES)[number]>("Technical Round");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");

  useEffect(() => {
    if (!open) return;
    setRoundType((initialSlot?.roundType as (typeof INTERVIEW_TYPES)[number]) || "Technical Round");
    setInterviewDate(initialSlot?.interviewDate || "");
    setInterviewTime(initialSlot?.interviewTime || "");
  }, [open, initialSlot?.interviewDate, initialSlot?.interviewTime, initialSlot?.roundType]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isReschedule = mode === "reschedule";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} aria-label="Close scheduling modal" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-interview-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="border-b border-slate-200 bg-gradient-to-r from-primary-600/10 via-violet-500/10 to-transparent px-5 py-4 dark:border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="schedule-interview-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {isReschedule ? "Reschedule Interview" : "Schedule Interview"}
              </h2>
              {candidateName ? (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{candidateName}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Interview type
            <select
              className="surface-subtle mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              value={roundType}
              onChange={(event) => setRoundType(event.target.value as (typeof INTERVIEW_TYPES)[number])}
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Date
            <input
              type="date"
              min={today}
              className="surface-subtle mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              value={interviewDate}
              onChange={(event) => setInterviewDate(event.target.value)}
            />
          </label>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
            Time
            <input
              type="time"
              className="surface-subtle mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              value={interviewTime}
              onChange={(event) => setInterviewTime(event.target.value)}
            />
          </label>
        </div>

        {overlapWarning ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {overlapWarning}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || !interviewDate || !interviewTime}
            className="bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
            onClick={() => void onConfirm({ roundType, interviewDate, interviewTime, mode: "online" })}
          >
            {saving ? (isReschedule ? "Updating..." : "Scheduling...") : isReschedule ? "Confirm Reschedule" : "Confirm Schedule"}
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
