"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Copy, Download, CalendarPlus, MapPin, MessageCircleWarning, MessageSquare, StickyNote, Timer, UserRound, X } from "lucide-react";
import type { ScheduledInterviewRecord } from "@/lib/interview-workflow";
import {
  formatInterviewDateTime,
  resolveRoundDurationMinutes,
  resolveRoundInterviewers
} from "@/lib/interview-workflow";
import { useInterviewCountdown } from "@/lib/use-interview-countdown";
import { downloadInterviewIcs, openGoogleCalendarForInterview } from "@/lib/interview-calendar-export";
import { InterviewJoinButton } from "@/components/dashboard/interview/interview-join-button";
import { formatInterviewJoinHint, resolveInterviewJoinHref } from "@/lib/interview-join";
import { InterviewStatusChip } from "./interview-status-chip";
import { Button } from "@/components/ui/button";
import { requestInterviewReschedule } from "@/lib/intern-portal";

type InterviewDetailsModalProps = {
  open: boolean;
  interview: ScheduledInterviewRecord | null;
  audience?: "intern" | "company";
  chatHref?: string;
  onViewProfile?: (applicationId: string) => void;
  onClose: () => void;
};

export function InterviewDetailsModal({
  open,
  interview,
  audience = "intern",
  chatHref = "/dashboard/intern/chat",
  onViewProfile,
  onClose
}: InterviewDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleSending, setRescheduleSending] = useState(false);
  const [rescheduleSent, setRescheduleSent] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const countdown = useInterviewCountdown(interview?.interviewDate, interview?.interviewTime);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowRescheduleForm(false);
      setRescheduleReason("");
      setRescheduleSent(false);
      setRescheduleError(null);
    }
  }, [open]);

  if (!open || !interview) return null;

  const joinHint = formatInterviewJoinHint(interview);
  const joinHref = resolveInterviewJoinHref(interview);
  const durationMinutes = resolveRoundDurationMinutes(interview);
  const interviewers = resolveRoundInterviewers(interview);
  const notes = interview.notes || "";
  const isOpenRound = !["completed", "cancelled", "no_show"].includes(interview.interviewStatus);
  const alreadyRequested = Boolean(interview.rescheduleRequestedByCandidate);

  async function submitRescheduleRequest() {
    if (!interview) return;
    try {
      setRescheduleSending(true);
      setRescheduleError(null);
      await requestInterviewReschedule(interview.applicationId, interview.interviewId, rescheduleReason.trim());
      setRescheduleSent(true);
      setShowRescheduleForm(false);
    } catch (err) {
      setRescheduleError((err as Error).message || "Failed to send reschedule request.");
    } finally {
      setRescheduleSending(false);
    }
  }

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
          {isOpenRound && countdown ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <Timer className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Starts in</p>
                <p className="text-slate-600 dark:text-slate-300">{countdown.label}</p>
              </div>
            </div>
          ) : null}
          {interview.mode ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Mode</p>
                <p className="capitalize text-slate-600 dark:text-slate-300">{interview.mode}</p>
              </div>
            </div>
          ) : null}
          {interview.mode === "offline" ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-slate-600 dark:text-slate-300">{interview.location || "Location shared with candidate"}</p>
              </div>
            </div>
          ) : null}
          {interviewers.length > 0 ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="font-medium">Interviewer{interviewers.length > 1 ? "s" : ""}</p>
                <p className="text-slate-600 dark:text-slate-300">{interviewers.map((entry) => entry.name).join(", ")}</p>
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
          {interview.cancelReason ? (
            <div className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <MessageCircleWarning className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <div>
                <p className="font-medium">Reason</p>
                <p className="text-slate-600 dark:text-slate-300">{interview.cancelReason}</p>
              </div>
            </div>
          ) : null}
        </div>

        {audience === "intern" && isOpenRound ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/60">
            {alreadyRequested || rescheduleSent ? (
              <p className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                <MessageCircleWarning className="h-3.5 w-3.5 shrink-0" />
                Reschedule request sent — the team will follow up.
              </p>
            ) : showRescheduleForm ? (
              <div className="space-y-2">
                <label htmlFor="reschedule-reason" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Why do you need to reschedule? (optional)
                </label>
                <textarea
                  id="reschedule-reason"
                  rows={2}
                  value={rescheduleReason}
                  onChange={(event) => setRescheduleReason(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="e.g. conflicting commitment at that time"
                />
                {rescheduleError ? <p className="text-xs text-rose-600 dark:text-rose-400">{rescheduleError}</p> : null}
                <div className="flex gap-2">
                  <Button type="button" size="sm" disabled={rescheduleSending} onClick={submitRescheduleRequest}>
                    {rescheduleSending ? "Sending…" : "Send Request"}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={rescheduleSending} onClick={() => setShowRescheduleForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowRescheduleForm(true)}>
                <MessageCircleWarning className="h-3.5 w-3.5" />
                Request Reschedule
              </Button>
            )}
          </div>
        ) : null}

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
          {audience === "company" && onViewProfile ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                onClose();
                onViewProfile(interview.applicationId);
              }}
            >
              <UserRound className="h-3.5 w-3.5" />
              View Profile
            </Button>
          ) : null}
          <InterviewJoinButton interview={interview} />
        </div>
      </div>
    </div>
  );
}
