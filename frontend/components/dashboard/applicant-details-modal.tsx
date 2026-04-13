"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import type { CompanyApplication } from "@/lib/company-portal";
import { ApplicantParsedResume } from "@/components/dashboard/applicant-parsed-resume";

function fmtDate(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

function fmtAppliedDateTime(value?: string) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = dt.getDate();
  const m = months[dt.getMonth()];
  const y = dt.getFullYear();
  let h = dt.getHours();
  const min = dt.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${d} ${m} ${y}, ${h}:${min} ${ampm}`;
}

const PIPELINE_STAGES = ["applied", "reviewed", "shortlisted", "interview_scheduled", "interview_completed", "selected", "rejected"] as const;

function normalizeStage(value: string) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "screening") return "reviewed";
  if (normalized === "interview") return "interview_scheduled";
  if (normalized === "offered") return "selected";
  return normalized;
}

export type InterviewFormState = {
  roundType: string;
  interviewDate: string;
  interviewTime: string;
  mode: "online" | "offline";
  meetingLink: string;
  location: string;
  notes: string;
};

export type ApplicantDetailsModalProps = {
  application: CompanyApplication;
  onClose: () => void;
  saving: boolean;
  inputClassName: string;
  statusDraft: string;
  onStatusDraftChange: (value: string) => void;
  onSaveStatus: () => void;
  onApplyStage: (status: string, note?: string) => void;
  interviewForm: InterviewFormState;
  onInterviewFormChange: (patch: Partial<InterviewFormState>) => void;
  onCreateInterview: () => void;
  onUpdateRound: (roundId: string, status: "scheduled" | "completed" | "cleared" | "rejected") => void;
  onViewResume: () => Promise<void>;
  resumeError: string | null;
};

export function ApplicantDetailsModal({
  application: a,
  onClose,
  saving,
  inputClassName: field,
  statusDraft,
  onStatusDraftChange,
  onSaveStatus,
  onApplyStage,
  interviewForm,
  onInterviewFormChange,
  onCreateInterview,
  onUpdateRound,
  onViewResume,
  resumeError
}: ApplicantDetailsModalProps) {
  const currentStage = normalizeStage(a.status);
  const matchPct = a.relevanceScore ?? a.matchScore ?? 0;
  const resumeScore = a.intern?.resume?.score ?? 0;
  const canOpenResume = Boolean(a.attachedResumePath || a.intern?.resume?.filePath);
  const resumeLabel = a.attachedResumePath ? "Application resume attached" : a.intern?.resume?.filePath ? "Profile resume" : "Not available";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const node =
    typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="applicant-details-title">
            <button type="button" className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]" aria-label="Close details" onClick={onClose} />
            <div className="relative z-[101] mb-0 flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:mb-0 sm:rounded-2xl">
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div>
                  <h2 id="applicant-details-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {a.intern?.fullName || "Candidate"}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{a.internship?.role || "Internship"}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Applied: <span className="font-medium text-slate-700 dark:text-slate-200">{fmtAppliedDateTime(a.createdAt)}</span>
                  </p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-6">
                  <section className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Applicant</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Email</span>
                        <p className="mt-0.5">{a.intern?.email || "-"}</p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Phone</span>
                        <p className="mt-0.5">{a.intern?.mobile || "-"}</p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Availability</span>
                        <p className="mt-0.5">{a.availabilityStatus === "yes" ? "Available now" : a.availabilityStatus === "no" ? "Not immediate" : "-"}</p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Available from</span>
                        <p className="mt-0.5">{fmtDate(a.joiningDate)}</p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Stage</span>
                        <p className="mt-0.5 capitalize">{currentStage.replace(/_/g, " ")}</p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Scores</span>
                        <p className="mt-0.5">
                          Match {matchPct}% · Resume {resumeScore}
                        </p>
                      </div>
                      <div className="surface-subtle rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-slate-300 sm:col-span-2">
                        <span className="font-semibold">Resume file</span>
                        <p className="mt-0.5">{resumeLabel}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Hiring workflow</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                      {PIPELINE_STAGES.map((stage) => {
                        const isCurrent = currentStage === stage;
                        return (
                          <div
                            key={`${a._id}-${stage}`}
                            className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold capitalize ${
                              isCurrent
                                ? "border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-300"
                                : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                            }`}
                          >
                            {stage.replace(/_/g, " ")}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("shortlisted", "Shortlisted from applicant details")}>
                        Shortlist
                      </Button>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("rejected", "Rejected from applicant details")}>
                        Reject
                      </Button>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("reviewed", "Marked reviewed from applicant details")}>
                        Mark reviewed
                      </Button>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("interview_scheduled", "Interview scheduled from applicant details")}>
                        Interview scheduled
                      </Button>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("interview_completed", "Interview completed from applicant details")}>
                        Interview completed
                      </Button>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => onApplyStage("selected", "Selected from applicant details")}>
                        Select
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <select className={`${field} min-w-[200px] flex-1`} value={statusDraft} onChange={(e) => onStatusDraftChange(e.target.value)}>
                        <option value="applied">Applied</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="interview_completed">Interview Completed</option>
                        <option value="selected">Selected</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <Button type="button" size="sm" onClick={onSaveStatus} disabled={saving}>
                        Save status
                      </Button>
                    </div>
                  </section>

                  <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume file</p>
                      <Button type="button" size="sm" variant="secondary" disabled={saving || !canOpenResume} onClick={() => void onViewResume()}>
                        View resume
                      </Button>
                    </div>
                    {resumeError && <p className="text-xs text-rose-700 dark:text-rose-300">{resumeError}</p>}
                  </section>

                  <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Schedule interview</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <input
                        className={field}
                        placeholder="Round type (HR/Technical)"
                        value={interviewForm.roundType}
                        onChange={(e) => onInterviewFormChange({ roundType: e.target.value })}
                      />
                      <input type="date" className={field} value={interviewForm.interviewDate} onChange={(e) => onInterviewFormChange({ interviewDate: e.target.value })} />
                      <input type="time" className={field} value={interviewForm.interviewTime} onChange={(e) => onInterviewFormChange({ interviewTime: e.target.value })} />
                      <select className={field} value={interviewForm.mode} onChange={(e) => onInterviewFormChange({ mode: e.target.value as "online" | "offline" })}>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                      <input
                        className={`${field} sm:col-span-2`}
                        placeholder="Meeting link (for online)"
                        disabled={interviewForm.mode !== "online"}
                        value={interviewForm.meetingLink}
                        onChange={(e) => onInterviewFormChange({ meetingLink: e.target.value })}
                      />
                      <input
                        className={`${field} sm:col-span-2`}
                        placeholder="Location (for offline)"
                        disabled={interviewForm.mode !== "offline"}
                        value={interviewForm.location}
                        onChange={(e) => onInterviewFormChange({ location: e.target.value })}
                      />
                      <textarea
                        className={`${field} min-h-20 sm:col-span-2 lg:col-span-4`}
                        placeholder="Interview notes"
                        value={interviewForm.notes}
                        onChange={(e) => onInterviewFormChange({ notes: e.target.value })}
                      />
                      <div className="sm:col-span-2 lg:col-span-4">
                        <Button type="button" size="sm" onClick={onCreateInterview} disabled={saving}>
                          Create interview round
                        </Button>
                      </div>
                    </div>

                    {(a.interviewRounds || []).length > 0 && (
                      <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Interview rounds</p>
                        {(a.interviewRounds || []).map((round) => (
                          <div key={round._id} className="surface-subtle flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs">
                            <span>
                              {round.roundType || "Round"} · {fmtDate(round.interviewDate)} {round.interviewTime || ""} · {round.mode || "-"} ·{" "}
                              <span className="capitalize">{round.status || ""}</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="secondary" onClick={() => round._id && onUpdateRound(round._id, "completed")} disabled={saving || !round._id}>
                                Completed
                              </Button>
                              <Button type="button" size="sm" variant="secondary" onClick={() => round._id && onUpdateRound(round._id, "cleared")} disabled={saving || !round._id}>
                                Cleared
                              </Button>
                              <Button type="button" size="sm" variant="secondary" onClick={() => round._id && onUpdateRound(round._id, "rejected")} disabled={saving || !round._id}>
                                Reject round
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Parsed resume</p>
                    <ApplicantParsedResume intern={a.intern} />
                  </section>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return node;
}
