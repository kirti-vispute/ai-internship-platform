"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Award,
  Briefcase,
  CalendarDays,
  Clock,
  Code2,
  Globe,
  Link2,
  MapPin,
  StickyNote,
  Timer,
  UserSearch,
  Users,
  Video,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InterviewScheduleSlot } from "@/lib/ai-hiring";
import {
  decodeInterviewNotes,
  encodeInterviewNotes,
  INTERVIEW_DEFAULT_DURATION_MINUTES,
  INTERVIEW_DURATION_OPTIONS
} from "@/lib/interview-workflow";
import { InterviewerCombobox } from "./interviewer-combobox";

const INTERVIEW_TYPES: Array<{ value: string; icon: typeof Users }> = [
  { value: "HR Round", icon: Users },
  { value: "Technical Round", icon: Code2 },
  { value: "Managerial Round", icon: Briefcase },
  { value: "Final Round", icon: Award }
];
const INTERVIEW_TYPE_VALUES = INTERVIEW_TYPES.map((item) => item.value);
type InterviewType = (typeof INTERVIEW_TYPE_VALUES)[number];
type InterviewMode = "online" | "offline";

/* Platform quick-select maps onto the existing mode + meetingLink fields —
   no new API fields. The platform is re-derived from the link for display. */
type Platform = "meet" | "zoom" | "teams" | "offline";

const PLATFORMS: Array<{ value: Platform; label: string; placeholder?: string }> = [
  { value: "meet", label: "Google Meet", placeholder: "https://meet.google.com/…" },
  { value: "zoom", label: "Zoom", placeholder: "https://zoom.us/j/…" },
  { value: "teams", label: "Microsoft Teams", placeholder: "https://teams.microsoft.com/…" },
  { value: "offline", label: "Offline" }
];

export function detectPlatformFromLink(link?: string): Platform {
  const value = String(link || "").toLowerCase();
  if (value.includes("zoom.us")) return "zoom";
  if (value.includes("teams.microsoft") || value.includes("teams.live")) return "teams";
  return "meet";
}

type InterviewScheduleModalProps = {
  open: boolean;
  candidateName?: string;
  saving?: boolean;
  mode?: "schedule" | "reschedule";
  initialSlot?: Partial<InterviewScheduleSlot>;
  overlapWarning?: string | null;
  interviewerSuggestions?: string[];
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
  interviewerSuggestions = [],
  onClose,
  onConfirm
}: InterviewScheduleModalProps) {
  const [roundType, setRoundType] = useState<InterviewType>("Technical Round");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(INTERVIEW_DEFAULT_DURATION_MINUTES);
  const [interviewer, setInterviewer] = useState("");
  const [interviewMode, setInterviewMode] = useState<InterviewMode>("online");
  const [platform, setPlatform] = useState<Platform>("meet");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextType = INTERVIEW_TYPE_VALUES.includes(initialSlot?.roundType as InterviewType)
      ? (initialSlot?.roundType as InterviewType)
      : "Technical Round";
    setRoundType(nextType);
    setInterviewDate(initialSlot?.interviewDate || "");
    setInterviewTime(initialSlot?.interviewTime || "");
    const offline = initialSlot?.mode === "offline";
    setInterviewMode(offline ? "offline" : "online");
    setPlatform(offline ? "offline" : detectPlatformFromLink(initialSlot?.meetingLink));
    setMeetingLink(initialSlot?.meetingLink || "");
    setLocation(initialSlot?.location || "");
    const decoded = decodeInterviewNotes(initialSlot?.notes);
    setInterviewer(decoded.interviewer);
    setDurationMinutes(decoded.durationMinutes);
    setNotes(decoded.notes);
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
      notes: encodeInterviewNotes({ interviewer, durationMinutes }, notes.trim())
    });
  }

  return (
    <AnimatePresence>
      {open ? (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Close scheduling dialog"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-interview-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
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
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Interview type</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Interview type">
              {INTERVIEW_TYPES.map(({ value: type, icon: Icon }) => {
                const active = roundType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setRoundType(type)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{type.replace(" Round", "")}</span>
                  </button>
                );
              })}
            </div>
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

          {/* Duration */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Timer className="h-3.5 w-3.5" aria-hidden /> Duration
            </label>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Interview duration">
              {INTERVIEW_DURATION_OPTIONS.map((minutes) => {
                const active = durationMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDurationMinutes(minutes)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    {minutes} min
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Shown to your team on the interview card. Join windows and overlap checks always use the platform&apos;s standard {INTERVIEW_DEFAULT_DURATION_MINUTES}-minute slot.
            </p>
          </div>

          {/* Interviewer */}
          <div>
            <label htmlFor="interview-interviewer" className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <UserSearch className="h-3.5 w-3.5" aria-hidden /> Interviewer <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <InterviewerCombobox
              value={interviewer}
              onChange={setInterviewer}
              suggestions={interviewerSuggestions}
              placeholder="Search past interviewers or type a name…"
            />
          </div>

          {/* Platform quick-select (maps to existing online/offline mode) */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Meeting platform</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Meeting platform">
              {PLATFORMS.map(({ value, label }) => {
                const active = platform === value;
                const Icon = value === "offline" ? MapPin : Video;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPlatform(value);
                      setInterviewMode(value === "offline" ? "offline" : "online");
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      active
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-950/40 dark:text-primary-200"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone (informational — times are stored as entered) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Timezone: {typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "local"}
            </span>
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
                placeholder={PLATFORMS.find((item) => item.value === platform)?.placeholder || "https://meet.example.com/room"}
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
            {saving ? (isReschedule ? "Updating…" : "Scheduling…") : isReschedule ? "Confirm Reschedule" : "Schedule Interview"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
