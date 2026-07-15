"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Hourglass,
  LinkIcon,
  MapPin,
  MessageCircleWarning,
  RotateCcw,
  Search,
  Timer,
  UserCircle2,
  UserX,
  Users,
  Video
} from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardItemCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  extractAllFromApplication,
  formatInterviewDateTime,
  formatInterviewTimeLabel,
  isSameCalendarDay,
  normalizeInterviewDateInput,
  parseInterviewDateTime,
  resolveRoundDurationMinutes,
  resolveRoundInterviewers,
  type InterviewDisplayStatus,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import { useInterviewCountdown } from "@/lib/use-interview-countdown";
import { getInterviewJoinAvailability, resolveInterviewJoinHref } from "@/lib/interview-join";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";
import { InterviewJoinButton } from "@/components/dashboard/interview/interview-join-button";
import { InterviewDetailsModal } from "@/components/dashboard/interview/interview-details-modal";
import { getInterviewStageCandidates } from "../hiring/hiring-utils";
import { cn } from "@/lib/utils";

export type InterviewScheduleTarget = {
  applicationId: string;
  candidateName: string;
  roundId?: string;
  initialSlot?: {
    roundType?: string;
    interviewDate?: string;
    interviewTime?: string;
    durationMinutes?: number;
    timezone?: string;
    interviewers?: Array<{ name: string; role?: string }>;
    mode?: "online" | "offline" | "";
    meetingLink?: string;
    location?: string;
    notes?: string;
  };
};

type StatusFilter = "all" | "today" | "upcoming" | "in_progress" | "completed" | "cancelled" | "no_show";
type RoundAction = "completed" | "cancelled" | "no_show";

type InterviewSchedulingPanelProps = {
  applications: CompanyApplication[];
  saving?: boolean;
  /** Optional: render skeletons while scheduling data is being (re)fetched. */
  loading?: boolean;
  /** Optional: render an error state with a retry action. */
  error?: string | null;
  onRetry?: () => void;
  onViewProfile: (applicationId: string) => void;
  onScheduleInterview: (target: InterviewScheduleTarget) => void;
  onCancelInterview?: (item: ScheduledInterviewRecord) => void | Promise<void>;
  onUpdateRoundStatus?: (item: ScheduledInterviewRecord, status: RoundAction) => void | Promise<void>;
};

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Shows" }
];

const PAGE_SIZE = 10;

function DetailItem({
  icon: Icon,
  label,
  children
}: {
  icon: typeof Clock;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ds-accent)]" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--ds-muted)]">{label}</p>
        <div className="text-sm text-[var(--ds-text)]">{children}</div>
      </div>
    </div>
  );
}

function platformLabel(item: ScheduledInterviewRecord): string {
  if (item.mode === "offline") return "In person";
  const link = String(item.meetingLink || "").toLowerCase();
  if (link.includes("meet.google")) return "Google Meet";
  if (link.includes("zoom.us")) return "Zoom";
  if (link.includes("teams.microsoft") || link.includes("teams.live")) return "Microsoft Teams";
  return "Platform room";
}

function InterviewCard({
  item,
  saving,
  onViewDetails,
  onViewProfile,
  onReschedule,
  onCancel,
  onUpdateStatus
}: {
  item: ScheduledInterviewRecord;
  saving: boolean;
  onViewDetails: (item: ScheduledInterviewRecord) => void;
  onViewProfile: (applicationId: string) => void;
  onReschedule: (item: ScheduledInterviewRecord) => void;
  onCancel?: (item: ScheduledInterviewRecord) => void;
  onUpdateStatus?: (item: ScheduledInterviewRecord, action: RoundAction) => void;
}) {
  const [copied, setCopied] = useState(false);
  const isOnline = item.mode !== "offline";
  const joinHref = resolveInterviewJoinHref(item);
  const availability = getInterviewJoinAvailability(item);
  const durationMinutes = resolveRoundDurationMinutes(item);
  const interviewers = resolveRoundInterviewers(item);
  const countdown = useInterviewCountdown(item.interviewDate, item.interviewTime);
  const isOpenRound = !["completed", "cancelled", "no_show"].includes(item.interviewStatus);
  const isCancellable = isOpenRound;
  const canComplete = isOpenRound;
  const canMarkNoShow = isOpenRound;

  async function copyLink() {
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
    <CompanyDashboardItemCard className="gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="ds-h3 truncate">{item.candidateName || item.role}</h3>
            <InterviewStatusChip status={item.interviewStatus} />
          </div>
          <p className="ds-caption mt-0.5 truncate">
            {item.role}
            {item.interviewType ? ` · ${item.interviewType}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            isOnline
              ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300"
              : "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
          )}
        >
          {isOnline ? <Video className="h-3.5 w-3.5" aria-hidden /> : <MapPin className="h-3.5 w-3.5" aria-hidden />}
          {platformLabel(item)}
        </span>
      </div>

      {item.rescheduleRequestedByCandidate ? (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <MessageCircleWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Candidate requested a reschedule
            {item.rescheduleRequestedByCandidate.reason ? `: “${item.rescheduleRequestedByCandidate.reason}”` : "."}
          </span>
        </p>
      ) : null}

      {/* Detail grid */}
      <div className="grid gap-3 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-3 sm:grid-cols-2">
        <DetailItem icon={CalendarDays} label="Date">
          {parseInterviewDateTime(item.interviewDate, item.interviewTime)
            ? formatInterviewDateTime(item.interviewDate, item.interviewTime).split(" at ")[0]
            : "Date TBD"}
        </DetailItem>
        <DetailItem icon={Clock} label="Time">
          {item.interviewTime ? formatInterviewTimeLabel(item.interviewTime) : "Time TBD"}
        </DetailItem>
        <DetailItem icon={Timer} label="Duration">
          {durationMinutes} min
        </DetailItem>
        <DetailItem icon={UserCircle2} label="Interviewer(s)">
          <span className="truncate">
            {interviewers.length > 0 ? interviewers.map((entry) => entry.name).join(", ") : `${item.companyName} hiring team`}
          </span>
        </DetailItem>
        <div className="sm:col-span-2">
          <DetailItem icon={isOnline ? LinkIcon : MapPin} label={isOnline ? "Meeting link" : "Location"}>
            {isOnline ? (
              joinHref ? (
                <span className="break-all text-[var(--ds-accent)]">
                  {availability.isPlatformRoom ? "Secure platform room ready" : joinHref}
                </span>
              ) : (
                <span className="text-[var(--ds-muted)]">Link generated at start time</span>
              )
            ) : (
              <span className="break-words">{item.location || "Location shared with candidate"}</span>
            )}
          </DetailItem>
        </div>
        {isOpenRound && countdown ? (
          <div className="sm:col-span-2">
            <DetailItem icon={Timer} label="Starts in">
              {countdown.label}
            </DetailItem>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className={cn(companyDashboardStyles.actionsRow, "mt-auto")}>
        <Button type="button" size="sm" variant="secondary" onClick={() => onViewDetails(item)}>
          View Details
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onViewProfile(item.applicationId)}>
          Candidate Profile
        </Button>
        {isOnline && joinHref ? (
          <Button type="button" size="sm" variant="ghost" onClick={copyLink} aria-label="Copy meeting link">
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
            {copied ? "Copied" : "Copy Link"}
          </Button>
        ) : null}
        {isOpenRound ? (
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => onReschedule(item)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reschedule
          </Button>
        ) : null}
        {canComplete && onUpdateStatus ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => onUpdateStatus(item, "completed")}
            className="text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Complete
          </Button>
        ) : null}
        {canMarkNoShow && onUpdateStatus ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => onUpdateStatus(item, "no_show")}
            className="text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <UserX className="h-3.5 w-3.5" aria-hidden />
            No Show
          </Button>
        ) : null}
        {isCancellable && onCancel ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => onCancel(item)}
            className="text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Ban className="h-3.5 w-3.5" aria-hidden />
            Cancel
          </Button>
        ) : null}
        <InterviewJoinButton interview={item} />
      </div>
    </CompanyDashboardItemCard>
  );
}

function candidateInitials(name?: string) {
  return (
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?"
  );
}

function stageLabel(status?: string) {
  return String(status || "interview").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Candidate awaiting an interview round — name, scores, skills, stage, primary CTA. */
function AwaitingCandidateCard({
  application,
  saving,
  onViewProfile,
  onScheduleInterview
}: {
  application: CompanyApplication;
  saving: boolean;
  onViewProfile: (applicationId: string) => void;
  onScheduleInterview: (target: InterviewScheduleTarget) => void;
}) {
  const name = application.intern?.fullName || "Candidate";
  const resumeScore = application.intern?.resume?.score;
  const atsScore = application.intern?.resume?.analysis?.categoryScores?.ats;
  const skills = (application.intern?.skills || []).slice(0, 4);

  return (
    <CompanyDashboardItemCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500/30 to-violet-500/30 text-sm font-bold text-primary-200 ring-2 ring-[var(--ds-border)]">
          {candidateInitials(name)}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="ds-h3 truncate">{name}</h4>
            <span className="inline-flex shrink-0 items-center rounded-full bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-300 ring-1 ring-violet-500/30">
              {stageLabel(application.status)}
            </span>
          </div>
          <p className="ds-caption truncate">{application.internship?.role || "Role"}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {typeof resumeScore === "number" && resumeScore > 0 ? (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-muted)]">
                Resume {Math.round(resumeScore)}
              </span>
            ) : null}
            {typeof atsScore === "number" && atsScore > 0 ? (
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--ds-muted)]">
                ATS {Math.round(atsScore)}
              </span>
            ) : null}
            {skills.map((skill) => (
              <span key={skill} className="rounded-md bg-primary-950/40 px-2 py-0.5 text-[10px] font-medium text-primary-300">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={cn(companyDashboardStyles.actionsRow, "shrink-0")}>
        <Button type="button" size="sm" variant="ghost" onClick={() => onViewProfile(application._id)}>
          View Profile
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving}
          onClick={() =>
            onScheduleInterview({
              applicationId: application._id,
              candidateName: name
            })
          }
        >
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Schedule Interview
        </Button>
      </div>
    </CompanyDashboardItemCard>
  );
}

function SkeletonCard() {
  return (
    <div className={cn(companyDashboardStyles.itemCard, "animate-pulse gap-4")}>
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-40 rounded bg-[var(--ds-surface-raised)]" />
        <div className="h-5 w-20 rounded-full bg-[var(--ds-surface-raised)]" />
      </div>
      <div className="grid gap-3 rounded-xl border border-[var(--ds-border)] p-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-8 rounded bg-[var(--ds-surface-raised)]" />
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-xl bg-[var(--ds-surface-raised)]" />
        <div className="h-9 w-24 rounded-xl bg-[var(--ds-surface-raised)]" />
      </div>
    </div>
  );
}

const ACTION_COPY: Record<RoundAction, { title: string; confirmLabel: string; description: (item: ScheduledInterviewRecord) => string }> = {
  cancelled: {
    title: "Cancel this interview?",
    confirmLabel: "Cancel Interview",
    description: (item) =>
      `${item.candidateName || item.role} will no longer see this ${item.interviewType || "interview"} on their calendar. This can't be undone.`
  },
  completed: {
    title: "Mark this interview completed?",
    confirmLabel: "Mark Completed",
    description: (item) => `${item.candidateName || item.role}'s ${item.interviewType || "interview"} will be marked completed.`
  },
  no_show: {
    title: "Mark candidate as a no-show?",
    confirmLabel: "Mark No-Show",
    description: (item) =>
      `${item.candidateName || item.role} didn't join the ${item.interviewType || "interview"}. This will record it as a no-show.`
  }
};

export function InterviewSchedulingPanel({
  applications,
  saving = false,
  loading = false,
  error = null,
  onRetry,
  onViewProfile,
  onScheduleInterview,
  onCancelInterview,
  onUpdateRoundStatus
}: InterviewSchedulingPanelProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ScheduledInterviewRecord | null>(null);
  const [actionTarget, setActionTarget] = useState<{ item: ScheduledInterviewRecord; action: RoundAction } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Every round regardless of status — the status filter tabs (including
  // Completed/Cancelled/No Shows) do the narrowing, not the extraction step.
  const scheduled = useMemo(() => applications.flatMap((app) => extractAllFromApplication(app)), [applications]);
  const awaiting = useMemo(
    () =>
      getInterviewStageCandidates(applications).filter(
        (app) => !(app.interviewRounds || []).some((round) => round.status === "scheduled")
      ),
    [applications]
  );

  const counts = useMemo(() => {
    const now = new Date();
    const base: Record<StatusFilter, number> = {
      all: scheduled.length,
      today: 0,
      upcoming: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };
    scheduled.forEach((item) => {
      const start = parseInterviewDateTime(item.interviewDate, item.interviewTime);
      if (start && isSameCalendarDay(start, now)) base.today += 1;
      if (item.interviewStatus === "upcoming") base.upcoming += 1;
      else if (item.interviewStatus === "in_progress") base.in_progress += 1;
      else if (item.interviewStatus === "completed") base.completed += 1;
      else if (item.interviewStatus === "cancelled") base.cancelled += 1;
      else if (item.interviewStatus === "no_show") base.no_show += 1;
    });
    return base;
  }, [scheduled]);

  const filtered = useMemo(() => {
    let list = scheduled;
    if (filter === "today") {
      const now = new Date();
      list = list.filter((item) => {
        const start = parseInterviewDateTime(item.interviewDate, item.interviewTime);
        return start ? isSameCalendarDay(start, now) : false;
      });
    } else if (filter !== "all") {
      list = list.filter((item) => item.interviewStatus === (filter as InterviewDisplayStatus));
    }

    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const interviewers = resolveRoundInterviewers(item)
          .map((entry) => entry.name)
          .join(" ")
          .toLowerCase();
        return (
          (item.candidateName || "").toLowerCase().includes(query) ||
          item.role.toLowerCase().includes(query) ||
          (item.interviewType || "").toLowerCase().includes(query) ||
          interviewers.includes(query)
        );
      });
    }

    if (dateFrom) {
      list = list.filter((item) => normalizeInterviewDateInput(item.interviewDate) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((item) => normalizeInterviewDateInput(item.interviewDate) <= dateTo);
    }

    return list;
  }, [scheduled, filter, search, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function applyFilter(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  function handleReschedule(item: ScheduledInterviewRecord) {
    onScheduleInterview({
      applicationId: item.applicationId,
      candidateName: item.candidateName || item.role,
      roundId: item.interviewId,
      initialSlot: {
        roundType: item.interviewType,
        interviewDate: normalizeInterviewDateInput(item.interviewDate),
        interviewTime: item.interviewTime,
        durationMinutes: resolveRoundDurationMinutes(item),
        interviewers: resolveRoundInterviewers(item),
        mode: item.mode,
        meetingLink: item.mode === "offline" ? "" : item.meetingLink,
        location: item.mode === "offline" ? item.location : "",
        notes: item.notes
      }
    });
  }

  async function confirmAction() {
    if (!actionTarget) return;
    try {
      setActionBusy(true);
      if (actionTarget.action === "cancelled" && onCancelInterview) {
        await onCancelInterview(actionTarget.item);
      } else if (onUpdateRoundStatus) {
        await onUpdateRoundStatus(actionTarget.item, actionTarget.action);
      }
      setActionTarget(null);
    } finally {
      setActionBusy(false);
    }
  }

  const totalTracked = scheduled.length + awaiting.length;

  return (
    <>
      <CompanyDashboardSection
        id="dashboard-interview-scheduling"
        icon={CalendarClock}
        title="Interview Scheduling"
        description="Coordinate interview rounds, track statuses, and keep candidates moving through the pipeline."
      >
        {/* Summary tiles */}
        {!loading && !error && totalTracked > 0 ? (
          <div className={cn(companyDashboardStyles.metricGrid, companyDashboardStyles.metricGridFour, "mb-4")}>
            {[
              { label: "Today", value: counts.today, icon: CalendarClock },
              { label: "Upcoming", value: counts.upcoming, icon: CalendarDays },
              { label: "In progress", value: counts.in_progress, icon: Clock },
              { label: "Awaiting round", value: awaiting.length, icon: Hourglass }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={cn(companyDashboardStyles.metricTile, "flex items-center gap-3")}>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ds-surface-raised)] text-[var(--ds-accent)]">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="ds-stat-value leading-none">{value}</p>
                  <p className="ds-label mt-1">{label}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className={companyDashboardStyles.listStack} aria-busy="true" aria-live="polite">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          /* Error + retry */
          <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 py-8 text-center dark:border-rose-900/60 dark:bg-rose-950/30">
            <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Couldn&apos;t load interview data</p>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">{error}</p>
            </div>
            {onRetry ? (
              <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Retry
              </Button>
            ) : null}
          </div>
        ) : totalTracked === 0 ? (
          /* Friendly empty state */
          <CompanyDashboardEmptyState
            title="No interviews to schedule yet"
            description="Once you move shortlisted candidates into the interview stage, they'll appear here ready to schedule."
          >
            <span className="mt-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ds-surface-raised)] text-[var(--ds-accent)]">
              <CalendarClock className="h-6 w-6" aria-hidden />
            </span>
          </CompanyDashboardEmptyState>
        ) : (
          <div className="space-y-5">
            {/* Filter tabs */}
            {scheduled.length > 0 ? (
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter interviews by status">
                {FILTERS.map(({ value, label }) => {
                  const active = filter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => applyFilter(value)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                        active
                          ? "bg-primary-600 text-white"
                          : "border border-[var(--ds-border)] text-[var(--ds-muted)] hover:bg-[var(--ds-surface-raised)]"
                      )}
                    >
                      {label}
                      <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-white/25" : "bg-[var(--ds-surface-raised)]")}>
                        {counts[value]}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Search + date range */}
            {scheduled.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ds-muted)]" aria-hidden />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search candidate, role, or interviewer…"
                    className="w-full rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] py-1.5 pl-8 pr-3 text-xs text-[var(--ds-text)] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                  />
                </div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setPage(1);
                  }}
                  aria-label="From date"
                  className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2 py-1.5 text-xs text-[var(--ds-text)] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
                <span className="text-xs text-[var(--ds-muted)]">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setPage(1);
                  }}
                  aria-label="To date"
                  className="rounded-lg border border-[var(--ds-border)] bg-[var(--ds-surface)] px-2 py-1.5 text-xs text-[var(--ds-text)] outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
            ) : null}

            {/* Scheduled interview cards */}
            {filtered.length > 0 ? (
              <div className={companyDashboardStyles.cardGridTwo}>
                {visible.map((item) => (
                  <InterviewCard
                    key={item.interviewId}
                    item={item}
                    saving={saving}
                    onViewDetails={setSelected}
                    onViewProfile={onViewProfile}
                    onReschedule={handleReschedule}
                    onCancel={onCancelInterview ? (target) => setActionTarget({ item: target, action: "cancelled" }) : undefined}
                    onUpdateStatus={onUpdateRoundStatus ? (target, action) => setActionTarget({ item: target, action }) : undefined}
                  />
                ))}
              </div>
            ) : scheduled.length > 0 ? (
              <p className="ds-caption rounded-xl border border-dashed border-[var(--ds-border)] px-4 py-6 text-center">
                No interviews match this filter.
              </p>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={safePage <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  Prev
                </Button>
                <span className="ds-caption">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            ) : null}

            {/* Awaiting scheduling */}
            {awaiting.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--ds-accent)]" aria-hidden />
                  <h3 className="ds-label">Awaiting scheduling ({awaiting.length})</h3>
                </div>
                <div className={companyDashboardStyles.listStack}>
                  {awaiting.slice(0, 5).map((application) => (
                    <AwaitingCandidateCard
                      key={application._id}
                      application={application}
                      saving={saving}
                      onViewProfile={onViewProfile}
                      onScheduleInterview={onScheduleInterview}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CompanyDashboardSection>

      <InterviewDetailsModal
        open={Boolean(selected)}
        interview={selected}
        audience="company"
        onClose={() => setSelected(null)}
      />

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title={actionTarget ? ACTION_COPY[actionTarget.action].title : ""}
        description={actionTarget ? ACTION_COPY[actionTarget.action].description(actionTarget.item) : undefined}
        confirmLabel={actionTarget ? ACTION_COPY[actionTarget.action].confirmLabel : "Confirm"}
        cancelLabel="Go Back"
        tone={actionTarget?.action === "completed" ? "default" : "danger"}
        busy={actionBusy}
        onConfirm={confirmAction}
        onCancel={() => setActionTarget(null)}
      />
    </>
  );
}
