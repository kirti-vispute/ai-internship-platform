"use client";

import { useMemo } from "react";
import { GitBranch } from "lucide-react";
import type { CompanyApplication } from "@/lib/company-portal";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardMetricTile,
  CompanyDashboardPanelCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "@/components/dashboard/company/company-dashboard-layout";
import {
  EXTENDED_PIPELINE_STAGES,
  HIRING_FLOW_STAGES,
  OVERVIEW_PIPELINE_STAGES,
  computeExtendedStageCounts,
  computeFlowStageCounts
} from "./hiring-utils";

type PipelineOverviewProps = {
  applications: CompanyApplication[];
  variant?: "standard" | "overview" | "extended";
};

export function PipelineOverview({ applications, variant = "standard" }: PipelineOverviewProps) {
  const counts = useMemo(() => computeFlowStageCounts(applications), [applications]);
  const extendedCounts = useMemo(() => computeExtendedStageCounts(applications), [applications]);
  const stages =
    variant === "extended"
      ? EXTENDED_PIPELINE_STAGES
      : variant === "overview"
        ? OVERVIEW_PIPELINE_STAGES
        : HIRING_FLOW_STAGES;
  const stageCounts = variant === "extended" ? extendedCounts : counts;
  const total = applications.length || 1;
  const sectionId =
    variant === "overview" ? "dashboard-pipeline" : variant === "extended" ? "hiring-pipeline-extended" : "hiring-pipeline";

  return (
    <CompanyDashboardSection
      id={sectionId}
      icon={GitBranch}
      title="Hiring Pipeline"
      description="Track conversion from applied to selected with live stage counts."
    >
      {applications.length === 0 ? (
        <CompanyDashboardEmptyState title="Pipeline fills in once applications arrive." />
      ) : (
        <CompanyDashboardPanelCard>
          <div className="mb-5 flex h-2.5 overflow-hidden rounded-full bg-white/5">
            {stages.map((stage) => {
              const value = stageCounts[stage.key as keyof typeof stageCounts] || 0;
              const width = (value / total) * 100;
              if (width <= 0) return null;
              const colors: Record<string, string> = {
                applied: "bg-slate-400",
                shortlisted: "bg-sky-500",
                interview: "bg-violet-500",
                interview_scheduled: "bg-violet-500",
                interviewed: "bg-indigo-500",
                selected: "bg-emerald-500",
                rejected: "bg-rose-400"
              };
              return (
                <div
                  key={stage.key}
                  className={`h-full transition-all duration-500 ${colors[stage.key] || "bg-slate-400"}`}
                  style={{ width: `${width}%` }}
                  title={`${stage.label}: ${value}`}
                />
              );
            })}
          </div>

          <div
            className={
              variant === "extended"
                ? companyDashboardStyles.metricGridFive
                : variant === "overview"
                  ? companyDashboardStyles.metricGridFour
                  : companyDashboardStyles.metricGridFive
            }
          >
            {stages.map((stage, index) => {
              const value = stageCounts[stage.key as keyof typeof stageCounts] || 0;
              const previous =
                index === 0 ? total : stageCounts[stages[index - 1].key as keyof typeof stageCounts] || 0;
              const conversion = index === 0 ? 100 : previous > 0 ? Math.round((value / previous) * 100) : 0;
              return (
                <CompanyDashboardMetricTile
                  key={stage.key}
                  label={stage.label}
                  value={value}
                  className="text-center"
                  hint={index === 0 ? "Top of funnel" : `${conversion}% conversion`}
                />
              );
            })}
          </div>
        </CompanyDashboardPanelCard>
      )}
    </CompanyDashboardSection>
  );
}
