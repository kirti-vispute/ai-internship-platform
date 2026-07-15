"use client";

import { useMemo } from "react";
import { Activity, AlertCircle, CalendarClock, ClipboardList, Users } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardMetricTile,
  CompanyDashboardPanelCard,
  CompanyDashboardSection
} from "./company-dashboard-layout";
import { getInterviewStageCandidates, normalizeRawStatus } from "../hiring/hiring-utils";
import { extractScheduledInterviews } from "@/lib/interview-workflow";

type TodayHiringActivityPanelProps = {
  applications: CompanyApplication[];
};

function isToday(value?: string) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function TodayHiringActivityPanel({ applications }: TodayHiringActivityPanelProps) {
  const metrics = useMemo(() => {
    const interviewsToday = extractScheduledInterviews(applications).filter((item) =>
      isToday(item.interviewDate)
    ).length;
    const newApplicantsToday = applications.filter((app) => {
      const appliedAt = (app as CompanyApplication & { appliedAt?: string; createdAt?: string }).appliedAt;
      const createdAt = (app as CompanyApplication & { createdAt?: string }).createdAt;
      return isToday(appliedAt || createdAt);
    }).length;
    const pendingReviews = applications.filter((app) =>
      ["applied", "reviewed", "under_review", "screening"].includes(normalizeRawStatus(app.status))
    ).length;
    const awaitingFeedback = applications.filter((app) =>
      ["interview_scheduled", "interview_completed", "technical_round", "hr_round"].includes(
        normalizeRawStatus(app.status)
      )
    ).length;
    const scheduledInterviews = getInterviewStageCandidates(applications).length;

    return {
      interviewsToday,
      newApplicantsToday,
      pendingReviews,
      awaitingFeedback,
      scheduledInterviews
    };
  }, [applications]);

  return (
    <CompanyDashboardSection
      id="dashboard-today-activity"
      icon={Activity}
      title="Today's Hiring Activity"
      description="What needs your attention right now?"
    >
      <CompanyDashboardPanelCard className="bg-gradient-to-br from-slate-950/20 via-transparent to-primary-950/20">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CompanyDashboardMetricTile
            label="Interviews Today"
            value={metrics.interviewsToday}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="New Applicants Today"
            value={metrics.newApplicantsToday}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Pending Candidate Reviews"
            value={metrics.pendingReviews}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Awaiting Feedback"
            value={metrics.awaitingFeedback}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Scheduled Interviews"
            value={metrics.scheduledInterviews}
            className="company-dashboard-kpi-accent"
          />
        </div>

        <div className="mt-4 grid gap-2 text-xs text-[var(--ds-muted)] sm:grid-cols-2 xl:grid-cols-5">
          <p className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Live interview load
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Fresh pipeline intake
          </p>
          <p className="inline-flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" />
            Screening backlog
          </p>
          <p className="inline-flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Post-interview follow-ups
          </p>
          <p className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            Interview pipeline
          </p>
        </div>
      </CompanyDashboardPanelCard>
    </CompanyDashboardSection>
  );
}
