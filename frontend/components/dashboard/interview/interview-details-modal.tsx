"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Copy, Download, CalendarPlus, MapPin, MessageSquare, StickyNote, UserRound, X } from "lucide-react";
import type { ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { decodeInterviewNotes, formatInterviewDateTime } from "@/lib/interview-workflow";
import { downloadInterviewIcs, openGoogleCalendarForInterview } from "@/lib/interview-calendar-export";
import { InterviewJoinButton } from "@/components/dashboard/interview/interview-join-button";
import { formatInterviewJoinHint, resolveInterviewJoinHref } from "@/lib/interview-join";
import { InterviewStatusChip } from "./interview-status-chip";
import { Button } from "@/components/ui/button";

type InterviewDetailsModalProps = {
  open: boolean;
  interview: ScheduledInterviewRecord | null;
  audience?: "intern" | "company";
  chatHref?: string;
  onClose: () => void;
};

export function InterviewDetailsModal({
  open,
  interview,
  audience = "intern",
  chatHref = "/dashboard/intern/chat",
  onClose
}: InterviewDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open || !interview) return null;

  const joinHint = formatInterviewJoinHint(interview);
  const joinHref = resolveInterviewJoinHref(interview);
  const { interviewer, durationMinutes, notes } = decodeInterviewNotes(interview.notes);

  async function copyMeetingLink() {
    if (!joinHref) return;
    const absolute = /^https?:\/\//i.test(joinHref)
      ? joinHref
      : typeof window !== "undefined"
        ? `${window.location.origin}${joinHref}`
        : joinHref;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore silently */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={onClose} aria-label="Close interview details" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-details-title"
        className="relative z-10 w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-2">
              <InterviewStatusChip status={interview.interviewStatus} />
            </div>
            <h2 id="interview-details-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {interview.interviewType}
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              {interview.role} · {audience === "company" ? interview.candidateName : interview.companyName}
            </p>
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

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
            <div>
              <p className="font-medium">Schedule</p>
              <p className="text-slate-600 dark:text-slate-300">
                {formatInterviewDateTime(interview.interviewDate, interview.interviewTime)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Duration: {durationMinutes} minutes</p>
              {joinHint ? <p className="mt-1 text-xs text-primary-700 dark:text-primary-300">{joinHint}</p> : null}
            </div>
          </div>
          {interview.mode ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Mode</p>
                <p className="capitalize text-slate-600 dark:text-slate-300">{interview.mode}</p>
              </div>
            </div>
          ) : null}
          {interviewer ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Interviewer</p>
                <p className="text-slate-600 dark:text-slate-300">{interviewer}</p>
              </div>
            </div>
          ) : null}
          {notes ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Notes</p>
                <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{notes}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => openGoogleCalendarForInterview(interview, audience)}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Google Calendar
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => downloadInterviewIcs(interview, audience)}>
            <Download className="h-3.5 w-3.5" />
            Download .ics
          </Button>
          {joinHref ? (
            <Button type="button" size="sm" variant="secondary" onClick={copyMeetingLink} aria-label="Copy meeting link">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
          {audience === "intern" ? (
            <Button type="button" size="sm" variant="secondary" href={chatHref}>
              <MessageSquare className="h-3.5 w-3.5" />
              Message Recruiter
            </Button>
          ) : null}
          <InterviewJoinButton interview={interview} />
        </div>
      </div>
    </div>
  );
}
