"use client";

import { CalendarClock, FilePlus2, Users } from "lucide-react";
import { CompanyDashboardPanelCard, CompanyDashboardSection } from "@/components/dashboard/company/company-dashboard-layout";
import { Button } from "@/components/ui/button";

type QuickActionsPanelProps = {
  canPostJob: boolean;
  onViewAllApplications: () => void;
  onScheduleInterviews: () => void;
};

export function QuickActionsPanel({ canPostJob, onViewAllApplications, onScheduleInterviews }: QuickActionsPanelProps) {
  return (
    <CompanyDashboardSection id="hiring-actions" title="Quick Actions" description="What should I do next?">
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
        </div>
      </CompanyDashboardPanelCard>
    </CompanyDashboardSection>
  );
}
