"use client";

import { BarChart3, CalendarClock, FilePlus2, UsersRound, Users } from "lucide-react";
import { CompanyDashboardPanelCard, CompanyDashboardSection } from "@/components/dashboard/company/company-dashboard-layout";
import { Button } from "@/components/ui/button";

type QuickActionsPanelProps = {
  canPostJob: boolean;
  isExecutive?: boolean;
  onViewAllApplications: () => void;
  onScheduleInterviews: () => void;
};

export function QuickActionsPanel({ canPostJob, isExecutive, onViewAllApplications, onScheduleInterviews }: QuickActionsPanelProps) {
  return (
    <CompanyDashboardSection
      id="hiring-actions"
      title="Quick Actions"
      description={isExecutive ? "Strategic oversight and hiring controls." : "What should I do next?"}
    >
      <CompanyDashboardPanelCard>
        <div className="flex flex-col gap-2">
          {canPostJob ? (
            <Button href="/dashboard/company/hiring/post" size="sm" className="w-full justify-start">
              <FilePlus2 className="h-4 w-4" />
              Post New Job
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="secondary" className="w-full justify-start" onClick={onViewAllApplications}>
            <Users className="h-4 w-4" />
            View All Applications
          </Button>
          <Button type="button" size="sm" variant="secondary" className="w-full justify-start" onClick={onScheduleInterviews}>
            <CalendarClock className="h-4 w-4" />
            Schedule Interviews
          </Button>
          {isExecutive ? (
            <>
              <Button href="/dashboard/company/analytics/company" size="sm" variant="secondary" className="w-full justify-start">
                <BarChart3 className="h-4 w-4" />
                View Company Analytics
              </Button>
              <Button href="/dashboard/company/team/recruiters" size="sm" variant="secondary" className="w-full justify-start">
                <UsersRound className="h-4 w-4" />
                Manage HR Team
              </Button>
            </>
          ) : null}
        </div>
      </CompanyDashboardPanelCard>
    </CompanyDashboardSection>
  );
}
