"use client";

import { useMemo } from "react";
import { Activity, CalendarClock, ClipboardList, Gift, TrendingUp, Users } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardMetricTile,
  CompanyDashboardPanelCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { AppIcon } from "@/components/icons/app-icon";
import { computeHiringProgress, countOffersPending, normalizeRawStatus } from "../hiring/hiring-utils";
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
    const candidatesAppliedToday = applications.filter((app) => {
      const appliedAt = (app as CompanyApplication & { appliedAt?: string; createdAt?: string }).appliedAt;
      const createdAt = (app as CompanyApplication & { createdAt?: string }).createdAt;
      return isToday(appliedAt || createdAt);
    }).length;
    const pendingReviews = applications.filter((app) =>
      ["applied", "reviewed", "under_review", "screening"].includes(normalizeRawStatus(app.status))
    ).length;
    const offersPending = countOffersPending(applications);
    const hiringProgress = computeHiringProgress(applications);

    return {
      interviewsToday,
      candidatesAppliedToday,
      pendingReviews,
      offersPending,
      hiringProgress
    };
  }, [applications]);

  return (
    <CompanyDashboardSection
      id="dashboard-today-activity"
      icon={Activity}
      title="Today's Hiring Overview"
      description="What needs your attention right now?"
    >
      <CompanyDashboardPanelCard className="bg-gradient-to-br from-[var(--ds-shadow)] via-transparent to-[var(--ds-primary)]/10">
        <div className={companyDashboardStyles.metricGridFive}>
          <CompanyDashboardMetricTile
            label="Applied Today"
            hint={
              <span className="flex items-start gap-1.5">
                <AppIcon icon={Users} size="xs" className="mt-0.5 shrink-0" />
                Fresh pipeline intake
              </span>
            }
            value={metrics.candidatesAppliedToday}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Interviews Today"
            hint={
              <span className="flex items-start gap-1.5">
                <AppIcon icon={CalendarClock} size="xs" className="mt-0.5 shrink-0" />
                Live interview load
              </span>
            }
            value={metrics.interviewsToday}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Pending Reviews"
            hint={
              <span className="flex items-start gap-1.5">
                <AppIcon icon={ClipboardList} size="xs" className="mt-0.5 shrink-0" />
                Screening backlog
              </span>
            }
            value={metrics.pendingReviews}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Offers Pending"
            hint={
              <span className="flex items-start gap-1.5">
                <AppIcon icon={Gift} size="xs" className="mt-0.5 shrink-0" />
                Awaiting candidate response
              </span>
            }
            value={metrics.offersPending}
            className="company-dashboard-kpi-accent"
          />
          <CompanyDashboardMetricTile
            label="Hiring Progress"
            hint={
              <span className="flex items-start gap-1.5">
                <AppIcon icon={TrendingUp} size="xs" className="mt-0.5 shrink-0" />
                Share of pipeline past Applied
              </span>
            }
            value={`${metrics.hiringProgress}%`}
            className="company-dashboard-kpi-accent"
          />
        </div>

      </CompanyDashboardPanelCard>
    </CompanyDashboardSection>
  );
}
