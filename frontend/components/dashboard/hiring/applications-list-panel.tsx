"use client";

import { Users } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardSection,
  companyDashboardStyles
} from "@/components/dashboard/company/company-dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { usePagination } from "@/lib/use-pagination";
import { normalizeToPipelineStage, PIPELINE_STAGE_TONE } from "./hiring-utils";
import { CandidateCompareToggle } from "@/components/dashboard/company/candidate-compare-toggle";
import { ResumeZipDownloadButton } from "./resume-zip-download-button";

const PAGE_SIZE = 10;

type ApplicationsListPanelProps = {
  applications: CompanyApplication[];
  onViewProfile: (applicationId: string) => void;
};

/**
 * The focused "Applicants" hiring page: every candidate who has applied,
 * across every role, as a plain in-page list (not the drawer-style
 * ApplicationsSheet modal, which stays reserved for job-scoped and
 * interview-stage drill-ins triggered from the Jobs/Shortlist pages).
 */
export function ApplicationsListPanel({ applications, onViewProfile }: ApplicationsListPanelProps) {
  const { setPage, totalPages, safePage, pageItems: visible } = usePagination(applications, PAGE_SIZE);

  return (
    <CompanyDashboardSection
      id="hiring-applications"
      icon={Users}
      title="All Applications"
      description="Every candidate who has applied, across every role."
      actions={applications.length > 0 ? <ResumeZipDownloadButton label="Download All Resumes" /> : undefined}
    >
      {applications.length === 0 ? (
        <CompanyDashboardEmptyState title="Applications will appear here once candidates start applying to your roles." />
      ) : (
        <div className="space-y-2">
          {visible.map((application) => {
            const stage = normalizeToPipelineStage(application.status);
            return (
              <div
                key={application._id}
                className="company-dashboard-item-card flex flex-col gap-3 !p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--ds-text)]">
                    {application.intern?.fullName || "Candidate"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-xs text-[var(--ds-muted)]">{application.internship?.role || "Role"}</p>
                    <Badge tone={PIPELINE_STAGE_TONE[stage] || "neutral"} className="capitalize">
                      {stage.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CandidateCompareToggle applicationId={application._id} />
                  <Button type="button" size="sm" variant="secondary" onClick={() => onViewProfile(application._id)}>
                    View Profile
                  </Button>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className={companyDashboardStyles.paginationRow}>
              <p className="ds-caption">
                Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, applications.length)} of{" "}
                {applications.length}
              </p>
              <Pagination page={safePage + 1} totalPages={totalPages} onChange={(next) => setPage(next - 1)} />
            </div>
          )}
        </div>
      )}
    </CompanyDashboardSection>
  );
}
