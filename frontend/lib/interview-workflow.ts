import type { Application } from "@/lib/intern-portal";
import type { CompanyApplication } from "@/lib/company-portal";
import type { ScheduledInterview } from "@/lib/intern-portal";
import { extractInterviewRoomIdFromLink } from "@/lib/interview-portal";

export type InterviewDisplayStatus =
  | "scheduled"
  | "upcoming"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ScheduledInterviewRecord = {
  interviewId: string;
  applicationId: string;
  companyId?: string;
  candidateId?: string;
  roleId?: string;
  companyName: string;
  candidateName?: string;
  role: string;
  interviewDate: string;
  interviewTime: string;
  interviewType: string;
  interviewStatus: InterviewDisplayStatus;
  meetingLink?: string;
  roomId?: string | null;
  mode?: "online" | "offline" | "";
  rawRoundStatus?: string;
};

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  label: string;
};

export const INTERVIEW_DEFAULT_DURATION_MINUTES = 60;

const JOIN_WINDOW_MS = 15 * 60 * 1000;
const LATE_JOIN_MS = 3 * 60 * 60 * 1000;
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const INTERVIEW_DURATION_MS = INTERVIEW_DEFAULT_DURATION_MINUTES * 60 * 1000;

/** Normalize API date values to YYYY-MM-DD for stable calendar grouping. */
export function normalizeInterviewDateInput(interviewDate?: string | Date | null): string {
  if (!interviewDate) return "";
  if (typeof interviewDate === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(interviewDate)) return interviewDate;
    if (interviewDate.includes("T")) return interviewDate.split("T")[0];
    const parsed = new Date(interviewDate);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return interviewDate.slice(0, 10);
  }
  if (!Number.isNaN(interviewDate.getTime())) return interviewDate.toISOString().slice(0, 10);
  return "";
}

export function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseInterviewDateTime(interviewDate?: string, interviewTime?: string): Date | null {
  const datePart = normalizeInterviewDateInput(interviewDate);
  if (!datePart) return null;
  const timePart = (interviewTime || "09:00").slice(0, 5);
  const parsed = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getInterviewEndDateTime(interviewDate?: string, interviewTime?: string): Date | null {
  const start = parseInterviewDateTime(interviewDate, interviewTime);
  if (!start) return null;
  return new Date(start.getTime() + INTERVIEW_DURATION_MS);
}

export function isActiveCalendarInterview(item: ScheduledInterviewRecord): boolean {
  const raw = String(item.rawRoundStatus || "").toLowerCase();
  if (raw === "rejected" || raw === "cancelled") return false;
  if (item.interviewStatus === "cancelled" || item.interviewStatus === "completed") return false;
  return true;
}

export function resolveInterviewDisplayStatus(
  roundStatus: string | undefined,
  interviewDate?: string,
  interviewTime?: string,
  now = Date.now()
): InterviewDisplayStatus {
  const normalized = String(roundStatus || "scheduled").toLowerCase();
  if (normalized === "rejected" || normalized === "cancelled") return "cancelled";
  if (normalized === "completed" || normalized === "cleared") return "completed";

  const start = parseInterviewDateTime(interviewDate, interviewTime);
  if (!start) return "scheduled";

  const startMs = start.getTime();
  const endMs = startMs + INTERVIEW_DURATION_MS;

  if (now >= startMs && now <= endMs) return "in_progress";
  if (now < startMs && startMs - now <= UPCOMING_WINDOW_MS) return "upcoming";
  return "scheduled";
}

export function interviewStatusMeta(status: InterviewDisplayStatus) {
  const map: Record<InterviewDisplayStatus, { label: string; emoji: string; className: string }> = {
    scheduled: {
      label: "Scheduled",
      emoji: "🟡",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
    },
    upcoming: {
      label: "Upcoming",
      emoji: "🔵",
      className: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"
    },
    in_progress: {
      label: "In Progress",
      emoji: "🟣",
      className: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300"
    },
    completed: {
      label: "Completed",
      emoji: "🟢",
      className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
    },
    cancelled: {
      label: "Cancelled",
      emoji: "🔴",
      className: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
    }
  };
  return map[status];
}

const INTERVIEW_DATE_LOCALE = "en-IN";

export function formatInterviewDateTime(interviewDate?: string, interviewTime?: string) {
  const start = parseInterviewDateTime(interviewDate, interviewTime);
  if (!start) return "Date TBD";
  const dateLabel = start.toLocaleDateString(INTERVIEW_DATE_LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeLabel = start.toLocaleTimeString(INTERVIEW_DATE_LOCALE, {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${dateLabel} at ${timeLabel}`;
}

export function formatInterviewTimeLabel(interviewTime?: string) {
  const start = parseInterviewDateTime("1970-01-01", interviewTime || "09:00");
  if (!start) return "";
  return start.toLocaleTimeString(INTERVIEW_DATE_LOCALE, { hour: "numeric", minute: "2-digit" });
}

export function getCountdownParts(targetDate?: string, targetTime?: string, now = Date.now()): CountdownParts | null {
  const target = parseInterviewDateTime(targetDate, targetTime);
  if (!target) return null;
  const totalMs = Math.max(0, target.getTime() - now);
  const days = Math.floor(totalMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((totalMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((totalMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((totalMs % (60 * 1000)) / 1000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Day${days === 1 ? "" : "s"}`);
  if (hours > 0 || days > 0) parts.push(`${hours} Hour${hours === 1 ? "" : "s"}`);
  if (days === 0) parts.push(`${minutes} Min`);
  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    label: parts.length > 0 ? parts.slice(0, 2).join(" ") : "Starting soon"
  };
}

export function canJoinInterviewRoom(
  interviewDate?: string,
  interviewTime?: string,
  displayStatus?: InterviewDisplayStatus,
  now = Date.now()
) {
  if (displayStatus === "completed" || displayStatus === "cancelled") return false;
  const start = parseInterviewDateTime(interviewDate, interviewTime);
  if (!start) return false;
  const startMs = start.getTime();
  return now >= startMs - JOIN_WINDOW_MS && now <= startMs + LATE_JOIN_MS;
}

export function findOverlappingInterviews(
  interviews: ScheduledInterviewRecord[],
  candidateDate: string,
  candidateTime: string,
  excludeInterviewId?: string
): ScheduledInterviewRecord[] {
  const candidateStart = parseInterviewDateTime(candidateDate, candidateTime);
  if (!candidateStart) return [];
  const candidateEnd = new Date(candidateStart.getTime() + INTERVIEW_DURATION_MS);

  return interviews.filter((item) => {
    if (excludeInterviewId && item.interviewId === excludeInterviewId) return false;
    if (!isActiveCalendarInterview(item)) return false;
    const start = parseInterviewDateTime(item.interviewDate, item.interviewTime);
    if (!start) return false;
    const end = new Date(start.getTime() + INTERVIEW_DURATION_MS);
    return candidateStart < end && candidateEnd > start;
  });
}

function extractAllFromApplication(app: Application | CompanyApplication): ScheduledInterviewRecord[] {
  const rounds = app.interviewRounds || [];
  const internship = app.internship;
  const companyName =
    internship && "company" in internship && internship.company?.companyName
      ? internship.company.companyName
      : "Company";
  const role = internship?.role || "Internship";
  const candidateName = ("intern" in app && app.intern?.fullName) || "Candidate";
  const candidateId = ("intern" in app && app.intern?._id) || ("internId" in app ? app.internId : undefined);
  const companyId = "companyId" in app ? app.companyId : undefined;
  const roleId = ("internshipId" in app ? app.internshipId : undefined) || internship?._id;

  return rounds.map((round, index) => {
    const interviewDate = normalizeInterviewDateInput(round.interviewDate) || String(round.interviewDate || "");
    const interviewTime = round.interviewTime || "";
    const displayStatus = resolveInterviewDisplayStatus(round.status, interviewDate, interviewTime);
    const meetingLink = round.meetingLink || "";
    return {
      interviewId: round._id || `${app._id}-${index}`,
      applicationId: app._id,
      companyId,
      candidateId,
      roleId,
      companyName,
      candidateName,
      role,
      interviewDate,
      interviewTime,
      interviewType: round.roundType || "Interview",
      interviewStatus: displayStatus,
      meetingLink,
      roomId: extractInterviewRoomIdFromLink(meetingLink),
      mode: round.mode,
      rawRoundStatus: round.status
    };
  });
}

function extractFromApplication(app: Application | CompanyApplication): ScheduledInterviewRecord[] {
  return extractAllFromApplication(app);
}

export function extractPastInterviews(applications: Application[] | CompanyApplication[]) {
  return applications
    .flatMap((app) => extractAllFromApplication(app))
    .filter(
      (item) =>
        item.interviewStatus === "completed" ||
        item.interviewStatus === "cancelled" ||
        item.rawRoundStatus === "rejected"
    )
    .sort(
      (a, b) =>
        (parseInterviewDateTime(b.interviewDate, b.interviewTime)?.getTime() || 0) -
        (parseInterviewDateTime(a.interviewDate, a.interviewTime)?.getTime() || 0)
    );
}

export function extractScheduledInterviews(applications: Application[] | CompanyApplication[]) {
  return applications
    .flatMap((app) => extractFromApplication(app))
    .filter(isActiveCalendarInterview)
    .sort(
      (a, b) =>
        (parseInterviewDateTime(a.interviewDate, a.interviewTime)?.getTime() || 0) -
        (parseInterviewDateTime(b.interviewDate, b.interviewTime)?.getTime() || 0)
    );
}

export function extractUpcomingInterviews(applications: Application[] | CompanyApplication[], limit = 3) {
  const now = Date.now();
  return extractScheduledInterviews(applications)
    .filter(
      (item) =>
        (parseInterviewDateTime(item.interviewDate, item.interviewTime)?.getTime() || 0) >= now - JOIN_WINDOW_MS
    )
    .slice(0, limit);
}

export function extractUpcomingInterviewRecords(records: ScheduledInterviewRecord[], limit = 3) {
  const now = Date.now();
  return records
    .filter(isActiveCalendarInterview)
    .filter(
      (item) =>
        (parseInterviewDateTime(item.interviewDate, item.interviewTime)?.getTime() || 0) >= now - JOIN_WINDOW_MS
    )
    .sort(
      (a, b) =>
        (parseInterviewDateTime(a.interviewDate, a.interviewTime)?.getTime() || 0) -
        (parseInterviewDateTime(b.interviewDate, b.interviewTime)?.getTime() || 0)
    )
    .slice(0, limit);
}

export function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function groupInterviewsByDate(interviews: ScheduledInterviewRecord[]) {
  const groups = new Map<string, ScheduledInterviewRecord[]>();
  interviews.forEach((item) => {
    const date = parseInterviewDateTime(item.interviewDate, item.interviewTime);
    const key = date ? toLocalDateKey(date) : "unscheduled";
    const bucket = groups.get(key) || [];
    bucket.push(item);
    groups.set(key, bucket);
  });
  return groups;
}

export function mapApiInterviewToRecord(item: ScheduledInterview): ScheduledInterviewRecord {
  const rawRoundStatus =
    item.interviewStatus === "cancelled"
      ? "rejected"
      : item.interviewStatus === "completed"
        ? "completed"
        : "scheduled";

  return {
    interviewId: item.interviewId,
    applicationId: item.applicationId,
    companyId: item.companyId,
    roleId: item.roleId,
    companyName: item.companyName,
    role: item.role,
    interviewDate: normalizeInterviewDateInput(item.interviewDate),
    interviewTime: item.interviewTime,
    interviewType: item.interviewType,
    interviewStatus: item.interviewStatus,
    meetingLink: item.meetingLink,
    roomId: item.roomId ?? extractInterviewRoomIdFromLink(item.meetingLink),
    mode: item.mode,
    rawRoundStatus
  };
}

export function mapApiInterviewsToRecords(items: ScheduledInterview[]): ScheduledInterviewRecord[] {
  return items.map(mapApiInterviewToRecord).filter(isActiveCalendarInterview);
}

export function getCalendarEventLabel(interview: ScheduledInterviewRecord, audience: "intern" | "company" = "intern") {
  return audience === "company"
    ? interview.candidateName || interview.role
    : interview.companyName;
}
