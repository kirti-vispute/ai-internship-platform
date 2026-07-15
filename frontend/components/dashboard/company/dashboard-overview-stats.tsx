"use client";

import { Briefcase, CalendarClock, Gift, UserCheck, Users } from "lucide-react";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { CompanyDashboardSection } from "./company-dashboard-layout";

type DashboardOverviewStatsProps = {
  activeJobs: number;
  applicants: number;
  shortlisted: number;
  interviews: number;
  offersSent?: number;
};

export function DashboardOverviewStats({
  activeJobs,
  applicants,
  shortlisted,
  interviews,
  offersSent = 0
}: DashboardOverviewStatsProps) {
  return (
    <CompanyDashboardSection
      id="dashboard-overview"
      title="Hiring Overview"
      description="Premium snapshot of active roles, pipeline momentum, and interview progress."
      className="company-dashboard-hero-accent"
    >
      <div className="stat-grid sm:grid-cols-2 xl:grid-cols-5">
        <SummaryStatCard title="Active Jobs" value={activeJobs} hint="Live internship postings." icon={Briefcase} />
        <SummaryStatCard title="Applicants" value={applicants} hint="Total candidates in your pipeline." icon={Users} />
        <SummaryStatCard title="Shortlisted" value={shortlisted} hint="Ready for interview scheduling." icon={UserCheck} />
        <SummaryStatCard title="Interviews Scheduled" value={interviews} hint="Candidates in interview stages." icon={CalendarClock} />
        <SummaryStatCard title="Offers Sent" value={offersSent} hint="Selected or offered candidates." icon={Gift} />
      </div>
    </CompanyDashboardSection>
  );
}
