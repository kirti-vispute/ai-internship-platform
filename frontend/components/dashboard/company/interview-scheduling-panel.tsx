"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardItemCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  extractScheduledInterviews,
  formatInterviewDateTime,
  normalizeInterviewDateInput
} from "@/lib/interview-workflow";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";
import { getInterviewStageCandidates } from "../hiring/hiring-utils";

export type InterviewScheduleTarget = {
  applicationId: string;
  candidateName: string;
  roundId?: string;
  initialSlot?: {
    roundType?: string;
    interviewDate?: string;
    interviewTime?: string;
  };
};

type InterviewSchedulingPanelProps = {
  applications: CompanyApplication[];
  saving?: boolean;
  onViewProfile: (applicationId: string) => void;
  onScheduleInterview: (target: InterviewScheduleTarget) => void;
};

export function InterviewSchedulingPanel({
  applications,
  saving = false,
  onViewProfile,
  onScheduleInterview
}: InterviewSchedulingPanelProps) {
  const interviewCandidates = useMemo(() => getInterviewStageCandidates(applications), [applications]);
  const scheduled = useMemo(() => extractScheduledInterviews(applications).slice(0, 6), [applications]);

  return (
    <CompanyDashboardSection
      id="dashboard-interview-scheduling"
      icon={CalendarClock}
      title="Interview Scheduling"
      description="Manage candidates in the interview stage and upcoming rounds."
    >
      {scheduled.length === 0 && interviewCandidates.length === 0 ? (
        <CompanyDashboardEmptyState title="Schedule interviews from shortlisted candidates to populate this workspace." />
      ) : (
        <div className={companyDashboardStyles.listStack}>
          {scheduled.map((item) => (
            <CompanyDashboardItemCard key={item.interviewId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="ds-h3">{item.candidateName || item.role}</h3>
                  <InterviewStatusChip status={item.interviewStatus} />
                </div>
                <p className="ds-caption">
                  {item.companyName} · {item.interviewType}
                </p>
                <p className="text-xs text-[var(--ds-muted)]">
                  {formatInterviewDateTime(item.interviewDate, item.interviewTime)}
                </p>
              </div>
              <div className={companyDashboardStyles.actionsRow}>
                <Button type="button" size="sm" variant="secondary" onClick={() => onViewProfile(item.applicationId)}>
                  View Profile
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() =>
                    onScheduleInterview({
                      applicationId: item.applicationId,
                      candidateName: item.candidateName || item.role,
                      roundId: item.interviewId,
                      initialSlot: {
                        roundType: item.interviewType,
                        interviewDate: normalizeInterviewDateInput(item.interviewDate),
                        interviewTime: item.interviewTime
                      }
                    })
                  }
                >
                  Reschedule
                </Button>
              </div>
            </CompanyDashboardItemCard>
          ))}

          {interviewCandidates
            .filter((app) => !(app.interviewRounds || []).some((round) => round.status === "scheduled"))
            .slice(0, 3)
            .map((application) => (
              <CompanyDashboardItemCard
                key={application._id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="ds-h3">{application.intern?.fullName || "Candidate"}</h3>
                  <p className="ds-caption">{application.internship?.role || "Role"}</p>
                  <p className="text-xs text-[var(--ds-muted)]">Interview stage · awaiting next round</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() =>
                    onScheduleInterview({
                      applicationId: application._id,
                      candidateName: application.intern?.fullName || "Candidate"
                    })
                  }
                >
                  Schedule Interview
                </Button>
              </CompanyDashboardItemCard>
            ))}
        </div>
      )}
    </CompanyDashboardSection>
  );
}
