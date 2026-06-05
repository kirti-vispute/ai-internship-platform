import type { Application } from "@/lib/intern-portal";
import type { CompanyApplication } from "@/lib/company-portal";
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

const JOIN_WINDOW_MS = 15 * 60 * 1000;
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

function parseInterviewDateTime(interviewDate?: string, interviewTime?: string): Date | null {
  if (!interviewDate) return null;
  const datePart = interviewDate.includes("T") ? interviewDate.split("T")[0] : interviewDate;
  const timePart = (interviewTime || "09:00").slice(0, 5);
  const parsed = new Date(`${datePart}T${timePart}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  const endMs = startMs + 60 * 60 * 1000;

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

export function formatInterviewDateTime(interviewDate?: string, interviewTime?: string) {
  const start = parseInterviewDateTime(interviewDate, interviewTime);
  if (!start) return "Date TBD";
  const dateLabel = start.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const timeLabel = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${dateLabel} at ${timeLabel}`;
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
  return now >= startMs - JOIN_WINDOW_MS && now <= startMs + 60 * 60 * 1000;
}

function extractFromApplication(app: Application | CompanyApplication): ScheduledInterviewRecord[] {
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

  return rounds
    .filter((round) => round.status !== "rejected")
    .map((round, index) => {
      const interviewDate = round.interviewDate || "";
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

export function extractScheduledInterviews(applications: Application[] | CompanyApplication[]) {
  return applications
    .flatMap((app) => extractFromApplication(app))
    .filter((item) => item.rawRoundStatus === "scheduled" || item.interviewStatus !== "completed")
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
        item.interviewStatus !== "completed" &&
        item.interviewStatus !== "cancelled" &&
        (parseInterviewDateTime(item.interviewDate, item.interviewTime)?.getTime() || 0) >= now - JOIN_WINDOW_MS
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
    const key = date ? date.toISOString().slice(0, 10) : "unscheduled";
    const bucket = groups.get(key) || [];
    bucket.push(item);
    groups.set(key, bucket);
  });
  return groups;
}
