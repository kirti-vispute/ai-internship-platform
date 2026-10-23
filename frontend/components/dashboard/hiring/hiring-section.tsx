"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";
import type { InterviewScheduleSlot } from "@/lib/ai-hiring";
import {
  CompanyDashboardMainGrid,
  CompanyDashboardPageIntro,
  companyDashboardStyles
} from "@/components/dashboard/company/company-dashboard-layout";
import { InterviewScheduleModal } from "@/components/dashboard/company/interview-schedule-modal";
import { ActiveJobsPanel } from "./active-jobs-panel";
import { ApplicationsListPanel } from "./applications-list-panel";
import { ApplicationsSheet } from "./applications-sheet";
import { HiringPipelineKanban } from "./hiring-pipeline-kanban";
import { PipelineOverview } from "./pipeline-overview";
import { QuickActionsPanel } from "./quick-actions-panel";
import { ShortlistPanel } from "./shortlist-panel";

export type HiringSectionFocus = "jobs" | "pipeline" | "shortlist" | "applications";

type RecruiterOption = {
  _id: string;
  email: string;
  companyAccountType: "hr" | "ceo";
};

// Each focus now renders exactly one panel below — no more every hiring page
// (Active/Applicants/Shortlisted/Pipeline) stacking the same three sections
// and just auto-scrolling to a different one.
type SheetState = { mode: "closed" } | { mode: "job"; internshipId: string; role: string } | { mode: "interviews" };

type ScheduleTarget = {
  applicationId: string;
  candidateName: string;
};

type HiringSectionProps = {
  internships: CompanyInternship[];
  applications: CompanyApplication[];
  matches?: CompanyMatchedCandidate[];
  focus?: HiringSectionFocus;
  isHrScoped: boolean;
  saving?: boolean;
  canAssign?: boolean;
  recruiters?: RecruiterOption[];
  selectedRecruiterByInternship?: Record<string, string>;
  onRecruiterChange?: (internshipId: string, recruiterId: string) => void;
  onAssignInternship?: (internshipId: string) => void;
  onDeleteInternship?: (internshipId: string) => void;
  onViewProfile: (applicationId: string) => void;
  onViewResume?: (applicationId: string) => void;
  onScheduleInterview?: (applicationId: string, slot: InterviewScheduleSlot) => Promise<void>;
  onMoveStage?: (applicationId: string, status: string, note?: string) => Promise<void>;
};

const HIRING_PAGE_COPY: Record<HiringSectionFocus, { title: string; subtitle: string }> = {
  jobs: {
    title: "Active Internships",
    subtitle: "Manage roles, pipeline, and shortlisted talent."
  },
  applications: {
    title: "Applicants",
    subtitle: "Every candidate who has applied, across every role."
  },
  shortlist: {
    title: "Shortlisted",
    subtitle: "Candidates ready for the next hiring stage. Schedule interviews to move them forward."
  },
  pipeline: {
    title: "Hiring Pipeline",
    subtitle: "Drag candidates between stages, or select several for bulk actions."
  }
};

export function HiringSection({
  internships,
  applications,
  matches = [],
  focus = "jobs",
  isHrScoped,
  saving = false,
  canAssign = false,
  recruiters = [],
  selectedRecruiterByInternship = {},
  onRecruiterChange,
  onAssignInternship,
  onDeleteInternship,
  onViewProfile,
  onViewResume,
  onScheduleInterview,
  onMoveStage
}: HiringSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sheet, setSheet] = useState<SheetState>({ mode: "closed" });
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget | null>(null);

  const sheetApplications =
    sheet.mode === "job"
      ? applications.filter((application) => application.internship?._id === sheet.internshipId)
      : applications;

  const sheetTitle = sheet.mode === "job" ? `Applications · ${sheet.role}` : "Schedule Interviews";
  const sheetSubtitle = sheet.mode === "interviews" ? "Candidates currently in the interview stage." : undefined;

  const pageCopy = HIRING_PAGE_COPY[focus];

  // "Review Candidates" in Quick Actions now takes you to the dedicated
  // Applicants page (keeping its own role-aware URL prefix: /company,
  // /dashboard/companyCEO or /dashboard/companyHR) instead of popping a
  // modal over whatever page you happened to be on.
  function goToApplicants() {
    const current = pathname || "";
    router.push(current.replace(/\/hiring\/[^/]+\/?$/, "/hiring/applicants"));
  }

  function renderMain() {
    if (focus === "applications") {
      return <ApplicationsListPanel applications={applications} onViewProfile={onViewProfile} />;
    }
    if (focus === "shortlist") {
      return (
        <ShortlistPanel
          applications={applications}
          matches={matches}
          internships={internships}
          saving={saving}
          onViewProfile={onViewProfile}
          onMessage={() => router.push("/dashboard/company/chat")}
          onViewResume={(applicationId) => onViewResume?.(applicationId)}
          onScheduleInterview={(applicationId, candidateName) => setScheduleTarget({ applicationId, candidateName })}
        />
      );
    }
    if (focus === "pipeline") {
      return onMoveStage ? (
        <HiringPipelineKanban
          applications={applications}
          matches={matches}
          internships={internships}
          saving={saving}
          onMoveStage={onMoveStage}
          onOpenProfile={onViewProfile}
          onViewResume={(applicationId) => onViewResume?.(applicationId)}
          onScheduleInterview={(applicationId, candidateName) => setScheduleTarget({ applicationId, candidateName })}
        />
      ) : (
        <PipelineOverview applications={applications} variant="extended" />
      );
    }
    return (
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
    );
  }

  return (
    <>
      <div className={companyDashboardStyles.pageStack}>
        <CompanyDashboardPageIntro
          title={pageCopy.title}
          subtitle={isHrScoped && focus === "jobs" ? "Your assigned recruitment workspace." : pageCopy.subtitle}
        />

        <CompanyDashboardMainGrid
          main={renderMain()}
          sidebar={
            <QuickActionsPanel
              canPostJob={!isHrScoped}
              isExecutive={!isHrScoped}
              onViewAllApplications={goToApplicants}
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
        internshipId={sheet.mode === "job" ? sheet.internshipId : undefined}
        showDownload={sheet.mode === "job"}
        onClose={() => setSheet({ mode: "closed" })}
        onViewProfile={onViewProfile}
      />

      <InterviewScheduleModal
        open={Boolean(scheduleTarget)}
        candidateName={scheduleTarget?.candidateName}
        saving={saving}
        onClose={() => setScheduleTarget(null)}
        onConfirm={async (slot) => {
          if (!scheduleTarget || !onScheduleInterview) return;
          await onScheduleInterview(scheduleTarget.applicationId, slot);
          setScheduleTarget(null);
        }}
      />
    </>
  );
}
