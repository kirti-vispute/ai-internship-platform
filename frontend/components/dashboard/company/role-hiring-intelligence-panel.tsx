"use client";

import { useMemo } from "react";
import { Target, TrendingUp } from "lucide-react";
import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";
import { hiringAIEngine } from "@/lib/ai-hiring";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardItemCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { Button } from "@/components/ui/button";

type RoleHiringIntelligencePanelProps = {
  matches: CompanyMatchedCandidate[];
  applications: CompanyApplication[];
  internships: CompanyInternship[];
  onOpenProfile: (applicationId: string) => void;
};

const difficultyTone: Record<string, string> = {
  Easy: "text-emerald-300 bg-emerald-950/40",
  Medium: "text-amber-300 bg-amber-950/40",
  Hard: "text-rose-300 bg-rose-950/40"
};

export function RoleHiringIntelligencePanel({
  matches,
  applications,
  internships,
  onOpenProfile
}: RoleHiringIntelligencePanelProps) {
  const input = useMemo(() => ({ matches, applications, internships }), [matches, applications, internships]);
  const predictions = useMemo(() => hiringAIEngine.computeAllHiringPredictions(input), [input]);
  const recommendations = useMemo(() => hiringAIEngine.recommendBestCandidatesByRole(input), [input]);
  const recommendationByJob = useMemo(
    () => new Map(recommendations.map((item) => [item.internshipId, item])),
    [recommendations]
  );

  const visiblePredictions = predictions.filter((item) => item.sufficient).slice(0, 6);

  if (visiblePredictions.length === 0) {
    return (
      <CompanyDashboardSection
        id="role-hiring-intelligence"
        icon={TrendingUp}
        title="Role Hiring Intelligence"
        description="Time-to-hire forecasts and recommended hires per role."
      >
        <CompanyDashboardEmptyState title="Predictions appear once roles receive applicants." />
      </CompanyDashboardSection>
    );
  }

  return (
    <CompanyDashboardSection
      id="role-hiring-intelligence"
      icon={TrendingUp}
      title="Role Hiring Intelligence"
      description="Time-to-hire forecasts and recommended hires per role."
    >
      <div className={companyDashboardStyles.cardGridTwo}>
        {visiblePredictions.map((prediction) => {
          const recommended = recommendationByJob.get(prediction.jobId);
          return (
            <CompanyDashboardItemCard key={prediction.jobId}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="ds-h3">{prediction.role}</h3>
                  <p className="ds-caption mt-1">
                    Est. {prediction.timeToHireEstimate} · {prediction.hiringProbability}% hire probability
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${difficultyTone[prediction.difficultyLevel]}`}
                >
                  {prediction.difficultyLevel}
                </span>
              </div>

              {recommended ? (
                <div className="mt-3 rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-3.5 w-3.5 text-emerald-400" />
                        <p className="ds-label text-emerald-300">Recommended Hire</p>
                      </div>
                      <p className="ds-body mt-1 truncate font-medium">{recommended.candidateName}</p>
                      <p className="ds-caption mt-0.5">
                        {recommended.matchScore}% match · {recommended.reasonForSelection}
                      </p>
                      {recommended.projectConfidenceWarning ? (
                        <p className="ds-caption mt-1 text-amber-300">{recommended.projectConfidenceWarning}</p>
                      ) : null}
                    </div>
                    {recommended.applicationId ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => onOpenProfile(recommended.applicationId!)}>
                        View
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="ds-caption mt-3">Insufficient match quality for a recommended hire yet.</p>
              )}
            </CompanyDashboardItemCard>
          );
        })}
      </div>
    </CompanyDashboardSection>
  );
}
