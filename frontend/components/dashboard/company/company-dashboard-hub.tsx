"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";
import type { InterviewScheduleSlot } from "@/lib/ai-hiring";
import { RecentMessagesWidget } from "@/components/dashboard/recent-messages-widget";
import { ShortlistPanel } from "@/components/dashboard/hiring/shortlist-panel";
import { ActiveJobsPanel } from "@/components/dashboard/hiring/active-jobs-panel";
import { ApplicationsSheet } from "@/components/dashboard/hiring/applications-sheet";
import { PipelineOverview } from "@/components/dashboard/hiring/pipeline-overview";
import { QuickActionsPanel } from "@/components/dashboard/hiring/quick-actions-panel";
import { countInterviewStageCandidates, countOffersSent } from "@/components/dashboard/hiring/hiring-utils";
import {
  CompanyDashboardMainGrid,
  CompanyDashboardPageIntro,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { DashboardOverviewStats } from "./dashboard-overview-stats";
import { HiringFunnelAnalyticsPanel } from "./hiring-funnel-analytics-panel";
import { InterviewScheduleModal } from "./interview-schedule-modal";
import { InterviewSchedulingPanel } from "./interview-scheduling-panel";
import { MatchedCandidatesPanel } from "./matched-candidates-panel";
import { RoleHiringIntelligencePanel } from "./role-hiring-intelligence-panel";
import { TodayHiringActivityPanel } from "./today-hiring-activity-panel";

type RecruiterOption = {
  _id: string;
  email: string;
  companyAccountType: "hr" | "ceo";
};

type SheetState =
  | { mode: "closed" }
  | { mode: "all" }
  | { mode: "job"; internshipId: string; role: string }
  | { mode: "interviews" };

type ScheduleTarget = {
  applicationId: string;
  candidateName: string;
};

type CompanyDashboardHubProps = {
  internships: CompanyInternship[];
  applications: CompanyApplication[];
  matches: CompanyMatchedCandidate[];
  shortlistedCount: number;
  isHrScoped: boolean;
  saving: boolean;
  canAssign: boolean;
  recruiters: RecruiterOption[];
  selectedRecruiterByInternship: Record<string, string>;
  onRecruiterChange: (internshipId: string, recruiterId: string) => void;
  onAssignInternship: (internshipId: string) => void;
  onDeleteInternship: (internshipId: string) => void;
  onOpenProfile: (applicationId: string) => void;
  onMessage: (match: CompanyMatchedCandidate, applicationId: string) => void;
  onShortlist: (applicationId: string) => void;
  onViewResume: (applicationId: string) => void;
  onScheduleInterview: (applicationId: string, slot: InterviewScheduleSlot) => Promise<void>;
};

export function CompanyDashboardHub({
  internships,
  applications,
  matches,
  shortlistedCount,
  isHrScoped,
  saving,
  canAssign,
  recruiters,
  selectedRecruiterByInternship,
  onRecruiterChange,
  onAssignInternship,
  onDeleteInternship,
  onOpenProfile,
  onMessage,
  onShortlist,
  onViewResume,
  onScheduleInterview
}: CompanyDashboardHubProps) {
  const router = useRouter();
  const [sheet, setSheet] = useState<SheetState>({ mode: "closed" });
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget | null>(null);

  const activeJobsCount = useMemo(() => internships.filter((item) => item.isActive).length, [internships]);
  const interviewCount = useMemo(() => countInterviewStageCandidates(applications), [applications]);
  const offersSent = useMemo(() => countOffersSent(applications), [applications]);

  const sheetApplications = useMemo(() => {
    if (sheet.mode === "job") {
      return applications.filter((application) => application.internship?._id === sheet.internshipId);
    }
    return applications;
  }, [applications, sheet]);

  const sheetTitle =
    sheet.mode === "job"
      ? `Applications · ${sheet.role}`
      : sheet.mode === "interviews"
        ? "Schedule Interviews"
        : "All Applications";

  const sheetSubtitle =
    sheet.mode === "interviews"
      ? "Candidates currently in the interview stage."
      : sheet.mode === "all"
        ? "Browse every application across active roles."
        : undefined;

  return (
    <>
      <div className={companyDashboardStyles.pageStack}>
        <CompanyDashboardPageIntro
          title="Company Dashboard"
          subtitle={
            isHrScoped
              ? "Your assigned recruitment workspace."
              : "AI hiring intelligence for roles, pipeline, and interviews."
          }
        />

        <CompanyDashboardMainGrid
          main={
            <>
              <DashboardOverviewStats
                activeJobs={activeJobsCount}
                applicants={applications.length}
                shortlisted={shortlistedCount}
                interviews={interviewCount}
                offersSent={offersSent}
              />

              <TodayHiringActivityPanel applications={applications} />

              <RecentMessagesWidget role="company" chatHref="/dashboard/company/chat" />

              <ActiveJobsPanel
                internships={internships}
                applications={applications}
                canAssign={canAssign}
                canDelete={!isHrScoped}
                saving={saving}
                recruiters={recruiters}
                selectedRecruiterByInternship={selectedRecruiterByInternship}
                onRecruiterChange={onRecruiterChange}
                onAssignRecruiter={onAssignInternship}
                onDeleteInternship={onDeleteInternship}
                onViewApplications={(internshipId, role) => setSheet({ mode: "job", internshipId, role })}
              />

              <MatchedCandidatesPanel
                matches={matches}
                applications={applications}
                internships={internships}
                defaultLimit={10}
                showViewAllLink
                saving={saving}
                onOpenProfile={onOpenProfile}
                onMessage={onMessage}
                onShortlist={onShortlist}
                onViewResume={onViewResume}
                onScheduleInterview={(applicationId, candidateName) => setScheduleTarget({ applicationId, candidateName })}
              />

              <ShortlistPanel
                applications={applications}
                matches={matches}
                internships={internships}
                saving={saving}
                onViewProfile={onOpenProfile}
                onMessage={() => router.push("/dashboard/company/chat")}
                onViewResume={onViewResume}
                onScheduleInterview={(applicationId, candidateName) => setScheduleTarget({ applicationId, candidateName })}
              />

              <InterviewSchedulingPanel
                applications={applications}
                saving={saving}
                onViewProfile={onOpenProfile}
                onScheduleInterview={(applicationId, candidateName) => setScheduleTarget({ applicationId, candidateName })}
              />

              <RoleHiringIntelligencePanel
                matches={matches}
                applications={applications}
                internships={internships}
                onOpenProfile={onOpenProfile}
              />

              <HiringFunnelAnalyticsPanel applications={applications} />

              <PipelineOverview applications={applications} variant="extended" />
            </>
          }
          sidebar={
            <QuickActionsPanel
              canPostJob={!isHrScoped}
              onViewAllApplications={() => setSheet({ mode: "all" })}
              onScheduleInterviews={() => setSheet({ mode: "interviews" })}
            />
          }
        />
      </div>

      <ApplicationsSheet
        open={sheet.mode !== "closed"}
        title={sheetTitle}
        subtitle={sheetSubtitle}
        applications={sheetApplications}
        filterStage={sheet.mode === "interviews" ? "interview" : null}
        onClose={() => setSheet({ mode: "closed" })}
        onViewProfile={onOpenProfile}
      />

      <InterviewScheduleModal
        open={Boolean(scheduleTarget)}
        candidateName={scheduleTarget?.candidateName}
        saving={saving}
        onClose={() => setScheduleTarget(null)}
        onConfirm={async (slot) => {
          if (!scheduleTarget) return;
          await onScheduleInterview(scheduleTarget.applicationId, slot);
          setScheduleTarget(null);
        }}
      />
    </>
  );
}
