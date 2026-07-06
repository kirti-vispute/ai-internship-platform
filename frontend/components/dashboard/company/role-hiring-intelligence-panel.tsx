"use client";

import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Gauge, Sparkles, Target, TrendingUp } from "lucide-react";
import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";
import type { BestCandidateRecommendation, HiringPrediction } from "@/lib/ai-hiring";
import { hiringAIEngine } from "@/lib/ai-hiring";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardItemCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RoleHiringIntelligencePanelProps = {
  matches: CompanyMatchedCandidate[];
  applications: CompanyApplication[];
  internships: CompanyInternship[];
  onOpenProfile: (applicationId: string) => void;
  /** Optional: render skeleton loaders while the parent is still fetching source data. */
  loading?: boolean;
};

const MAX_VISIBLE_ROLES = 6;

const difficultyTone: Record<string, string> = {
  Easy: "text-emerald-300 bg-emerald-950/40",
  Medium: "text-amber-300 bg-amber-950/40",
  Hard: "text-rose-300 bg-rose-950/40"
};

type Priority = "High" | "Medium" | "Low";

const priorityTone: Record<Priority, string> = {
  High: "text-rose-300 bg-rose-950/40 ring-1 ring-rose-500/30",
  Medium: "text-amber-300 bg-amber-950/40 ring-1 ring-amber-500/30",
  Low: "text-emerald-300 bg-emerald-950/40 ring-1 ring-emerald-500/30"
};

/**
 * Pure presentation helper — derives a concise, scannable insight from the
 * existing AI outputs. Does NOT alter recommendation generation or scoring.
 */
function buildRecommendationInsight(prediction: HiringPrediction, recommended?: BestCandidateRecommendation) {
  const priority: Priority =
    prediction.difficultyLevel === "Hard" || prediction.hiringProbability < 50
      ? "High"
      : prediction.difficultyLevel === "Medium" || prediction.hiringProbability < 75
        ? "Medium"
        : "Low";

  if (!recommended) {
    return {
      priority,
      mainRecommendation: "Keep sourcing candidates",
      reason: "No candidate yet clears the match-quality bar for a confident recommendation.",
      suggestedAction: "Widen outreach or revisit role requirements.",
      improvementOpportunity: null as string | null
    };
  }

  const needsEvidence = Boolean(recommended.projectConfidenceWarning) || recommended.confidenceScore <= 80;

  return {
    priority,
    mainRecommendation: `Advance ${recommended.candidateName}`,
    reason: recommended.whyRecommended[0] || recommended.reasonForSelection,
    suggestedAction: needsEvidence ? "Verify project evidence, then interview." : "Fast-track to interview.",
    improvementOpportunity: recommended.projectConfidenceWarning
  };
}

export function RoleHiringIntelligencePanel({
  matches,
  applications,
  internships,
  onOpenProfile,
  loading = false
}: RoleHiringIntelligencePanelProps) {
  const input = useMemo(() => ({ matches, applications, internships }), [matches, applications, internships]);
  const predictions = useMemo(() => hiringAIEngine.computeAllHiringPredictions(input), [input]);
  const recommendations = useMemo(() => hiringAIEngine.recommendBestCandidatesByRole(input), [input]);
  const recommendationByJob = useMemo(
    () => new Map(recommendations.map((item) => [item.internshipId, item])),
    [recommendations]
  );

  const visiblePredictions = predictions.filter((item) => item.sufficient).slice(0, MAX_VISIBLE_ROLES);

  if (loading) {
    return (
      <CompanyDashboardSection
        id="role-hiring-intelligence"
        icon={TrendingUp}
        title="AI Recommendation Insights"
        description="Concise, prioritized hiring recommendations per role."
      >
        <div className={companyDashboardStyles.cardGridTwo} aria-hidden>
          {Array.from({ length: 4 }).map((_, index) => (
            <RecommendationCardSkeleton key={index} />
          ))}
        </div>
      </CompanyDashboardSection>
    );
  }

  if (visiblePredictions.length === 0) {
    return (
      <CompanyDashboardSection
        id="role-hiring-intelligence"
        icon={TrendingUp}
        title="AI Recommendation Insights"
        description="Concise, prioritized hiring recommendations per role."
      >
        <CompanyDashboardEmptyState
          title="No recommendations yet"
          description="Insights appear here once your roles start receiving applicants."
        />
      </CompanyDashboardSection>
    );
  }

  return (
    <CompanyDashboardSection
      id="role-hiring-intelligence"
      icon={TrendingUp}
      title="AI Recommendation Insights"
      description="Concise, prioritized hiring recommendations per role."
    >
      <div className={companyDashboardStyles.cardGridTwo}>
        {visiblePredictions.map((prediction) => (
          <RecommendationCard
            key={prediction.jobId}
            prediction={prediction}
            recommended={recommendationByJob.get(prediction.jobId)}
            onOpenProfile={onOpenProfile}
          />
        ))}
      </div>
    </CompanyDashboardSection>
  );
}

type RecommendationCardProps = {
  prediction: HiringPrediction;
  recommended?: BestCandidateRecommendation;
  onOpenProfile: (applicationId: string) => void;
};

function RecommendationCard({ prediction, recommended, onOpenProfile }: RecommendationCardProps) {
  const insight = buildRecommendationInsight(prediction, recommended);

  return (
    <CompanyDashboardItemCard className="gap-3">
      {/* Header: role + priority badge (visual hierarchy / severity) */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="ds-h3 truncate">{prediction.role}</h3>
          <p className="ds-caption mt-0.5">
            Est. {prediction.timeToHireEstimate} · {prediction.hiringProbability}% hire probability
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            priorityTone[insight.priority]
          )}
        >
          {insight.priority} priority
        </span>
      </div>

      {/* Meta chips: difficulty + confidence (scannable stats) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold",
            difficultyTone[prediction.difficultyLevel]
          )}
        >
          {prediction.difficultyLevel} to fill
        </span>
        {recommended ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-medium text-[var(--ds-muted)]">
            <Gauge className="h-3 w-3" />
            {recommended.confidenceScore}% confidence
          </span>
        ) : null}
      </div>

      {/* Main recommendation + candidate */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-300" />
          <p className="ds-label text-primary-300">{insight.mainRecommendation}</p>
        </div>

        {recommended ? (
          <>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <Target className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <p className="ds-body truncate font-medium">{recommended.candidateName}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {recommended.recommendationLevel}
              </span>
            </div>

            {/* Match score bar (visual hierarchy) */}
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--ds-muted)]">Match</span>
                <span className="text-[11px] font-semibold text-[var(--ds-text)]">{recommended.matchScore}%</span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={recommended.matchScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Match score for ${recommended.candidateName}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-400"
                  style={{ width: `${Math.min(100, Math.max(0, recommended.matchScore))}%` }}
                />
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Concise structured insight: Reason / Action / Improvement */}
      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-muted)]">Reason</dt>
          <dd className="ds-caption line-clamp-2 min-w-0 flex-1 text-[var(--ds-text)]">{insight.reason}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--ds-muted)]">Action</dt>
          <dd className="ds-caption min-w-0 flex-1 text-[var(--ds-text)]">{insight.suggestedAction}</dd>
        </div>
        {insight.improvementOpportunity ? (
          <div className="flex gap-2">
            <dt className="flex w-16 shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              Fix
            </dt>
            <dd className="ds-caption line-clamp-2 min-w-0 flex-1 text-amber-200/90">{insight.improvementOpportunity}</dd>
          </div>
        ) : null}
      </dl>

      {/* Footer pinned to bottom for equal-height alignment */}
      {recommended?.applicationId ? (
        <div className="mt-auto pt-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => onOpenProfile(recommended.applicationId!)}
          >
            View candidate
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </CompanyDashboardItemCard>
  );
}

function RecommendationCardSkeleton() {
  return (
    <CompanyDashboardItemCard className="gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-40 animate-pulse rounded bg-white/5" />
        </div>
        <div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="h-16 w-full animate-pulse rounded-lg bg-white/5" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
      </div>
    </CompanyDashboardItemCard>
  );
}
