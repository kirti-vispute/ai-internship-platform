"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Brain, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { CompanyApplication, CompanyInternship, CompanyMatchedCandidate } from "@/lib/company-portal";
import { hiringAIEngine, type RankedCandidate } from "@/lib/ai-hiring";
import {
  CompanyDashboardEmptyState,
  CompanyDashboardItemCard,
  CompanyDashboardSection,
  companyDashboardStyles
} from "./company-dashboard-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AiMatchInsightPanel } from "./ai-match-insight-panel";

const DEFAULT_TOP_LIMIT = 10;

type MatchedCandidatesPanelProps = {
  matches: CompanyMatchedCandidate[];
  applications: CompanyApplication[];
  internships: CompanyInternship[];
  defaultLimit?: number;
  showViewAllLink?: boolean;
  saving?: boolean;
  onOpenProfile: (applicationId: string) => void;
  onMessage: (match: CompanyMatchedCandidate, applicationId: string) => void;
  onShortlist: (applicationId: string) => void;
  onViewResume: (applicationId: string) => void;
  onScheduleInterview: (applicationId: string, candidateName: string) => void;
};

export function MatchedCandidatesPanel({
  matches,
  applications,
  internships,
  defaultLimit = DEFAULT_TOP_LIMIT,
  showViewAllLink = false,
  saving = false,
  onOpenProfile,
  onMessage,
  onShortlist,
  onViewResume,
  onScheduleInterview
}: MatchedCandidatesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [openInsightKey, setOpenInsightKey] = useState<string | null>(null);

  const input = useMemo(() => ({ matches, applications, internships }), [matches, applications, internships]);
  const rankedCandidates = useMemo(() => hiringAIEngine.rankAllCandidates(input), [input]);
  const recommendedByRole = useMemo(() => hiringAIEngine.buildRecommendedByRoleMap(input), [input]);

  const visibleCandidates = useMemo(() => {
    if (expanded || defaultLimit <= 0) return rankedCandidates;
    return rankedCandidates.slice(0, defaultLimit);
  }, [rankedCandidates, expanded, defaultLimit]);

  const canExpand = rankedCandidates.length > defaultLimit;

  const sectionActions = (
    <>
      {canExpand ? (
        <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)}>
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Top {defaultLimit}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              View All ({rankedCandidates.length})
            </>
          )}
        </Button>
      ) : null}
      {showViewAllLink ? (
        <Link href="/dashboard/company/matching/ai" className="text-link text-sm font-semibold">
          Full page
        </Link>
      ) : null}
    </>
  );

  return (
    <CompanyDashboardSection
      id="dashboard-matched-candidates"
      icon={Sparkles}
      title="AI Matched Candidates"
      description={`Top ${defaultLimit} AI-ranked shortlist with explainable match and scheduling intelligence.`}
      actions={sectionActions}
    >
      {visibleCandidates.length === 0 ? (
        <CompanyDashboardEmptyState title="No matched candidates available yet." />
      ) : (
        <div className={companyDashboardStyles.cardGridThree}>
          {visibleCandidates.map((ranked) => {
            const recommended = recommendedByRole.get(ranked.internshipId);
            const isRecommended = recommended?.candidateId === cardKey(ranked);
            return (
              <CandidateCard
                key={`${ranked.internshipId}-${ranked.internProfileId || ranked.match.internProfile?._id || ranked.rankingPosition}`}
                ranked={ranked}
                internships={internships}
                isRecommended={isRecommended}
                saving={saving}
                insightOpen={openInsightKey === cardKey(ranked)}
                onToggleInsight={() =>
                  setOpenInsightKey((current) => (current === cardKey(ranked) ? null : cardKey(ranked)))
                }
                onOpenProfile={onOpenProfile}
                onMessage={onMessage}
                onShortlist={onShortlist}
                onViewResume={onViewResume}
                onScheduleInterview={onScheduleInterview}
              />
            );
          })}
        </div>
      )}
    </CompanyDashboardSection>
  );
}

function cardKey(ranked: RankedCandidate) {
  return ranked.internProfileId || ranked.applicationId || `${ranked.internshipId}-${ranked.rankingPosition}`;
}

type CandidateCardProps = {
  ranked: RankedCandidate;
  internships: CompanyInternship[];
  isRecommended: boolean;
  saving: boolean;
  insightOpen: boolean;
  onToggleInsight: () => void;
  onOpenProfile: (applicationId: string) => void;
  onMessage: (match: CompanyMatchedCandidate, applicationId: string) => void;
  onShortlist: (applicationId: string) => void;
  onViewResume: (applicationId: string) => void;
  onScheduleInterview: (applicationId: string, candidateName: string) => void;
};

function CandidateCard({
  ranked,
  internships,
  isRecommended,
  saving,
  insightOpen,
  onToggleInsight,
  onOpenProfile,
  onMessage,
  onShortlist,
  onViewResume,
  onScheduleInterview
}: CandidateCardProps) {
  const { match, applicationId, application } = ranked;
  const skills = (match.internProfile?.skills || application?.intern?.skills || []).slice(0, 4);
  const candidateName = match.internProfile?.fullName || "Candidate";
  const explanation = useMemo(() => hiringAIEngine.explainMatch(ranked, internships), [ranked, internships]);

  return (
    <CompanyDashboardItemCard highlighted={isRecommended} className="group overflow-hidden p-0">
      <button
        type="button"
        className="w-full px-5 pb-3 pt-5 text-left transition group-hover:bg-white/[0.03]"
        onClick={() => {
          if (applicationId) onOpenProfile(applicationId);
        }}
        disabled={!applicationId}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--ds-muted)]">
                #{ranked.rankingPosition}
              </span>
              {isRecommended ? (
                <span className="inline-flex rounded-md bg-emerald-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  Recommended Hire
                </span>
              ) : null}
              <h3 className="ds-h3 truncate">{candidateName}</h3>
            </div>
            <p className="ds-caption mt-0.5 truncate">{match.internshipRole}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full bg-primary-950/40 px-2.5 py-1 text-xs font-semibold text-primary-300">
              {ranked.evaluation.overallScore}%
            </span>
            <p className="mt-1 text-[10px] text-[var(--ds-muted)]">
              Conf. {ranked.evaluation.confidenceScore}% · {ranked.evaluation.recommendationLevel}
            </p>
          </div>
        </div>

        {ranked.strengths.length > 0 ? (
          <p className="mt-2 line-clamp-2 text-xs text-emerald-300">{ranked.strengths[0]}</p>
        ) : null}

        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={`${match.internshipId}-${skill}`}
                className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-medium text-[var(--ds-muted)]"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : null}
      </button>

      {insightOpen ? (
        <div className="px-5 pb-3">
          <AiMatchInsightPanel explanation={explanation} evaluation={ranked.evaluation} />
        </div>
      ) : null}

      <div className={cn(companyDashboardStyles.actionsFooter, "px-5 pb-3")}>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!applicationId || saving}
          onClick={(event) => {
            event.stopPropagation();
            onToggleInsight();
          }}
        >
          <Brain className="h-3.5 w-3.5" />
          AI Insight
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!applicationId || saving}
          onClick={(event) => {
            event.stopPropagation();
            if (applicationId) onMessage(match, applicationId);
          }}
        >
          Message
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!applicationId || saving}
          onClick={(event) => {
            event.stopPropagation();
            if (applicationId) onShortlist(applicationId);
          }}
        >
          Shortlist
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!applicationId || saving}
          onClick={(event) => {
            event.stopPropagation();
            if (applicationId) onViewResume(applicationId);
          }}
        >
          View Resume
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!applicationId || saving}
          className="bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
          onClick={(event) => {
            event.stopPropagation();
            if (applicationId) onScheduleInterview(applicationId, candidateName);
          }}
        >
          Schedule Interview
        </Button>
      </div>
    </CompanyDashboardItemCard>
  );
}
