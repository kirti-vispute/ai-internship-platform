"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Info,
  Link2,
  MapPin,
  StickyNote,
  Video,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InterviewScheduleSlot } from "@/lib/ai-hiring";
import { INTERVIEW_DEFAULT_DURATION_MINUTES } from "@/lib/interview-workflow";

const INTERVIEW_TYPES = ["Technical Round", "HR Round", "Final Round"] as const;
type InterviewType = (typeof INTERVIEW_TYPES)[number];
type InterviewMode = "online" | "offline";

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

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

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
  const [roundType, setRoundType] = useState<InterviewType>("Technical Round");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("online");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRoundType((initialSlot?.roundType as InterviewType) || "Technical Round");
    setInterviewDate(initialSlot?.interviewDate || "");
    setInterviewTime(initialSlot?.interviewTime || "");
    setInterviewMode(initialSlot?.mode === "offline" ? "offline" : "online");
    setMeetingLink(initialSlot?.meetingLink || "");
    setLocation(initialSlot?.location || "");
    setNotes(initialSlot?.notes || "");
    setTouched(false);
  }, [
    open,
    initialSlot?.interviewDate,
    initialSlot?.interviewTime,
    initialSlot?.roundType,
    initialSlot?.mode,
    initialSlot?.meetingLink,
    initialSlot?.location,
    initialSlot?.notes
  ]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const today = new Date().toISOString().slice(0, 10);

  const errors = useMemo(() => {
    const next: { date?: string; time?: string; location?: string; link?: string } = {};
    if (!interviewDate) next.date = "Please choose an interview date.";
    else if (interviewDate < today) next.date = "The date can't be in the past.";
    if (!interviewTime) next.time = "Please choose a start time.";
    if (interviewMode === "offline" && !location.trim()) next.location = "Add a venue or address for the on-site interview.";
    if (interviewMode === "online" && meetingLink.trim() && !/^https?:\/\//i.test(meetingLink.trim())) {
      next.link = "Enter a valid link starting with http:// or https://";
    }
    return next;
  }, [interviewDate, interviewTime, interviewMode, location, meetingLink, today]);

  const isValid = Object.keys(errors).length === 0;

  if (!open) return null;

  const isReschedule = mode === "reschedule";

  function handleConfirm() {
    setTouched(true);
    if (!isValid) return;
    void onConfirm({
      roundType,
      interviewDate,
      interviewTime,
      mode: interviewMode,
      meetingLink: interviewMode === "online" ? meetingLink.trim() : "",
      location: interviewMode === "offline" ? location.trim() : "",
      notes: notes.trim()
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close scheduling dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-interview-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-primary-600/10 via-violet-500/10 to-transparent px-5 py-4 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="schedule-interview-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {isReschedule ? "Reschedule Interview" : "Schedule Interview"}
              </h2>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {candidateName ? candidateName : "Set the round, date, time, and format"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {/* Interview type */}
          <div>
            <label htmlFor="interview-round-type" className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Interview round
            </label>
            <select
              id="interview-round-type"
              className={fieldClass}
              value={roundType}
              onChange={(event) => setRoundType(event.target.value as InterviewType)}
            >
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date + time */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="interview-date" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden /> Date
              </label>
              <input
                id="interview-date"
                type="date"
                min={today}
                className={cn(fieldClass, touched && errors.date && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/30")}
                value={interviewDate}
                aria-invalid={Boolean(touched && errors.date)}
                onChange={(event) => setInterviewDate(event.target.value)}
              />
              {touched && errors.date ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.date}</p> : null}
            </div>
            <div>
              <label htmlFor="interview-time" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Clock className="h-3.5 w-3.5" aria-hidden /> Start time
              </label>
              <input
                id="interview-time"
                type="time"
                className={cn(fieldClass, touched && errors.time && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/30")}
                value={interviewTime}
                aria-invalid={Boolean(touched && errors.time)}
                onChange={(event) => setInterviewTime(event.target.value)}
              />
              {touched && errors.time ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.time}</p> : null}
            </div>
          </div>

          {/* Duration (fixed) */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span>
              Each interview is provisioned for <strong className="font-semibold text-slate-800 dark:text-slate-100">{INTERVIEW_DEFAULT_DURATION_MINUTES} minutes</strong>.
            </span>
          </div>

          {/* Mode toggle */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Interview mode</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Interview mode">
              {([
                { value: "online" as const, label: "Online", icon: Video },
                { value: "offline" as const, label: "In person", icon: MapPin }
              ]).map(({ value, label, icon: Icon }) => {
                const active = interviewMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setInterviewMode(value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional: link or location */}
          {interviewMode === "online" ? (
            <div>
              <label htmlFor="interview-link" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <Link2 className="h-3.5 w-3.5" aria-hidden /> Meeting link <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="interview-link"
                type="url"
                inputMode="url"
                placeholder="https://meet.example.com/room"
                className={cn(fieldClass, touched && errors.link && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/30")}
                value={meetingLink}
                aria-invalid={Boolean(touched && errors.link)}
                onChange={(event) => setMeetingLink(event.target.value)}
              />
              {touched && errors.link ? (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.link}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Leave blank to auto-generate a secure platform room.</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="interview-location" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> Location
              </label>
              <input
                id="interview-location"
                type="text"
                placeholder="Office address, building, room…"
                className={cn(fieldClass, touched && errors.location && "border-rose-400 focus:border-rose-400 focus:ring-rose-400/30")}
                value={location}
                aria-invalid={Boolean(touched && errors.location)}
                onChange={(event) => setLocation(event.target.value)}
              />
              {touched && errors.location ? <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.location}</p> : null}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="interview-notes" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <StickyNote className="h-3.5 w-3.5" aria-hidden /> Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="interview-notes"
              rows={3}
              placeholder="Agenda, panel members, or prep instructions for the candidate…"
              className={cn(fieldClass, "resize-y")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {overlapWarning ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{overlapWarning}</span>
            </p>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/60">
          <Button type="button" size="sm" variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || (touched && !isValid)}
            className="bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
            onClick={handleConfirm}
          >
            {saving ? (isReschedule ? "Updating…" : "Scheduling…") : isReschedule ? "Confirm Reschedule" : "Confirm Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
