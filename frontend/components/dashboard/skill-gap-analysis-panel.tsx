"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { TARGET_ROLE_OPTIONS } from "@/lib/data/role-skill-profiles";
import { AiConfidenceBadge } from "@/components/dashboard/ai-confidence-badge";
import { runSkillGapPipeline } from "@/lib/ai-platform/orchestrator";
import {
  type ProgressBarItem,
  type QuickWinEffort,
  type QuickWinImpact,
  type QuickWinItem,
  type RequirementCheck,
  type SkillPriority,
  type SkillVisualStatus
} from "@/lib/skill-gap-engine";
import type { InternProfile, InternshipListing, ResumeAnalysis } from "@/lib/intern-portal";
import { cn } from "@/lib/utils";

type Props = {
  profile: InternProfile | null;
  analysis?: ResumeAnalysis | null | undefined;
  targetRoleKey?: string;
  onTargetRoleChange?: (roleKey: string) => void;
  loadingRole?: boolean;
  showRoleSelector?: boolean;
  /** When provided, the panel compares the student against this real internship posting instead of a generic role preset. */
  internship?: InternshipListing | null;
};

const card =
  "rounded-2xl border border-slate-200/40 bg-white/90 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.1)] backdrop-blur-sm transition-shadow duration-300 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.35)]";

const skillCard =
  "group rounded-xl border border-slate-200/50 bg-white/80 p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/60 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] dark:border-slate-700/50 dark:bg-slate-900/40 dark:hover:border-slate-600/60 dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]";

const STATUS_DOT: Record<SkillVisualStatus, string> = {
  strong: "bg-emerald-400",
  partial: "bg-amber-400",
  missing: "bg-rose-400"
};

const STATUS_LABEL: Record<SkillVisualStatus, string> = {
  strong: "Present",
  partial: "Partial evidence",
  missing: "Missing"
};

const STATUS_BADGE: Record<SkillVisualStatus, string> = {
  strong: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  partial: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  missing: "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300"
};

const SELF_REPORTED_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert"
};

const INSUFFICIENT_MSG = "Insufficient data for analysis";

const REQUIREMENT_STATUS_BADGE: Record<RequirementCheck["status"], string> = {
  match: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  mismatch: "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300",
  not_stated: "border-slate-200/70 bg-slate-50/70 text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300",
  unknown: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300"
};

const REQUIREMENT_STATUS_LABEL: Record<RequirementCheck["status"], string> = {
  match: "Matches",
  mismatch: "Mismatch",
  not_stated: "Not required",
  unknown: "Unknown"
};

function RequirementCheckCard({ title, check }: { title: string; check: RequirementCheck }) {
  return (
    <article className={skillCard}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
        <span className={cn("shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", REQUIREMENT_STATUS_BADGE[check.status])}>
          {REQUIREMENT_STATUS_LABEL[check.status]}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{check.explanation}</p>
    </article>
  );
}

const PRIORITY_BADGE: Record<SkillPriority, string> = {
  High: "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/30 dark:text-rose-300",
  Medium: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  Low: "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-300"
};

function roleInsight(match: number, roleLabel: string): string {
  if (match >= 85) return `You are job-ready for ${roleLabel} roles.`;
  if (match >= 70) return `You are close to job-ready for ${roleLabel}.`;
  if (match >= 50) return `A few focused improvements will strengthen your ${roleLabel} fit.`;
  return `Build core skills to move closer to ${roleLabel} roles.`;
}

function MatchProgressRing({ percent, showRange, low, high }: { percent: number; showRange: boolean; low: number; high: number }) {
  const [animated, setAnimated] = useState(0);
  const display = showRange ? Math.round((low + high) / 2) : percent;
  const size = 148;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(display));
    return () => cancelAnimationFrame(t);
  }, [display]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#matchGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="bg-gradient-to-br from-sky-600 via-emerald-600 to-indigo-600 bg-clip-text text-3xl font-bold tabular-nums tracking-tight text-transparent dark:from-sky-400 dark:via-emerald-400 dark:to-indigo-400">
          {showRange ? `${low}–${high}` : display}
          <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">%</span>
        </span>
        <span className="mt-0.5 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Match
        </span>
      </div>
    </div>
  );
}

function SkillCard({ item }: { item: ProgressBarItem }) {
  const selfReportedLabel = item.selfReportedLevel ? SELF_REPORTED_LABEL[item.selfReportedLevel] : null;

  return (
    <article className={skillCard}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", STATUS_DOT[item.status])} />
            <h4 className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">
              {item.displayName}
            </h4>
          </div>
          <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{item.tier} skill</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            STATUS_BADGE[item.status]
          )}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{item.tooltip}</p>

      {selfReportedLabel && (
        <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          You rated yourself: <span className="text-slate-800 dark:text-slate-100">{selfReportedLabel}</span>
        </p>
      )}
    </article>
  );
}

const IMPACT_BADGE: Record<QuickWinImpact, string> = {
  High: "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  Medium: "border-amber-200/80 bg-amber-50/80 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300"
};

const EFFORT_BADGE: Record<QuickWinEffort, string> = {
  Low: "border-sky-200/70 bg-sky-50/70 text-sky-700 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-300",
  Medium: "border-slate-200/80 bg-slate-50/90 text-slate-600 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-300"
};

function QuickWinCard({ item }: { item: QuickWinItem }) {
  return (
    <article
      className={cn(
        skillCard,
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      )}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{item.displayName}</h4>
        <dl className="grid gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex gap-2">
            <dt className="shrink-0 text-slate-400 dark:text-slate-500">Why:</dt>
            <dd className="min-w-0">{item.why}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-slate-400 dark:text-slate-500">Action:</dt>
            <dd className="min-w-0 font-medium text-slate-700 dark:text-slate-300">{item.action}</dd>
          </div>
        </dl>
        <a
          href={item.courseSearchUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-link inline-block text-sm"
        >
          Find courses for {item.displayName}
        </a>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            IMPACT_BADGE[item.impact]
          )}
        >
          {item.impact} impact
        </span>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            EFFORT_BADGE[item.effort]
          )}
        >
          {item.effort} effort
        </span>
      </div>
    </article>
  );
}

export function SkillGapAnalysisPanel({
  profile,
  analysis,
  targetRoleKey: targetRoleKeyProp,
  onTargetRoleChange,
  loadingRole,
  showRoleSelector = true,
  internship
}: Props) {
  const [localRole, setLocalRole] = useState(
    analysis?.skillIntelligence?.targetRoleKey || targetRoleKeyProp || "full_stack_developer"
  );
  const [showMoreBars, setShowMoreBars] = useState(false);
  const roleKey = targetRoleKeyProp || localRole;
  const target = internship || roleKey;

  const gap = useMemo(() => runSkillGapPipeline(profile, target, analysis), [profile, target, analysis]);

  const backendMatch = analysis?.skillIntelligence?.careerMatch?.matchPercent;
  // Backend ATS keyword-match % and this client engine's weighted skill-gap % measure
  // different things once scored against a real internship (whole-resume ATS quality
  // vs. deterministic 60/15/10/5/5/5 skill fit) — only blend them in generic-role mode.
  const blendBackend = !gap.scoredAgainstInternship && typeof backendMatch === "number" && gap.analysisConfidence >= 70;
  const exactMatch = blendBackend
    ? Math.round((gap.matchPercent + backendMatch) / 2)
    : gap.matchPercent;
  const rangeLow = blendBackend
    ? Math.max(0, Math.round((gap.matchPercentLow + backendMatch) / 2) - 2)
    : gap.matchPercentLow;
  const rangeHigh = blendBackend
    ? Math.min(100, Math.round((gap.matchPercentHigh + backendMatch) / 2) + 2)
    : gap.matchPercentHigh;

  // "Show more" reveals every skill in the dataset (not a second fixed cap) —
  // every skill that contributes to matchPercent's denominator must be
  // visible somewhere in the UI.
  const visibleBars = showMoreBars ? gap.progressBars : gap.progressBars.slice(0, 6);

  const quickWins = useMemo(() => {
    const shown = new Set(visibleBars.map((b) => b.skill));
    return gap.quickWins.filter((item) => !shown.has(item.skill)).slice(0, 5);
  }, [gap.quickWins, visibleBars]);

  if (!profile?.resumeUploaded) {
    return (
      <div className={cn(card, "px-8 py-16 text-center")}>
        <AppIcon icon={Upload} size="md" className="mx-auto text-sky-400" />
        <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">
          Upload your resume to see skill gap insights.
        </p>
        <Link href="/dashboard/intern/resume" className="text-link mt-4 inline-block text-base">
          Upload Resume
        </Link>
      </div>
    );
  }

  if (gap.insufficientData) {
    return (
      <div className={cn(card, "px-8 py-14 text-center")}>
        <AppIcon icon={AlertTriangle} size="md" className="mx-auto text-amber-400" />
        <p className="mt-6 text-base font-semibold leading-snug text-slate-700 dark:text-slate-200">
          {INSUFFICIENT_MSG}
        </p>
        <p className="mt-2 text-base leading-relaxed text-slate-500 dark:text-slate-400">
          Add skills or projects, then re-upload.
        </p>
        {gap.aiValidation ? (
          <div className="mt-6 flex justify-center">
            <AiConfidenceBadge
              confidenceScore={gap.aiValidation.confidenceScore}
              validationStatus={gap.aiValidation.validationStatus}
              confidenceTier={gap.aiValidation.confidenceTier}
              explanationTrace={gap.aiValidation.explanationTrace}
            />
          </div>
        ) : null}
      </div>
    );
  }

  const insightMatch = gap.showMatchRange ? rangeLow : exactMatch;

  return (
    <div className="space-y-12 text-[15px] leading-relaxed">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          Skill Gap Analysis
        </h2>
        {showRoleSelector && !internship && (
          <select
            id="sg-target-role"
            aria-label="Target role"
            className="ds-input ds-select h-10 max-w-xs text-base disabled:opacity-60"
            value={roleKey}
            disabled={loadingRole}
            onChange={(e) => {
              setLocalRole(e.target.value);
              onTargetRoleChange?.(e.target.value);
            }}
          >
            {TARGET_ROLE_OPTIONS.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <AiConfidenceBadge
        confidenceScore={gap.aiValidation.confidenceScore}
        validationStatus={gap.aiValidation.validationStatus}
        confidenceTier={gap.aiValidation.confidenceTier}
        explanationTrace={gap.aiValidation.explanationTrace}
      />

      {gap.lowConfidenceAnalysis && (
        <div className="rounded-xl border border-amber-200/50 bg-amber-50/40 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          Low confidence — match shown as a range until resume detail improves.
        </div>
      )}

      {/* A. Hero Overview */}
      <ScrollReveal variant="soft-scale" distance={10}>
        <section
          className={cn(
            card,
            "relative overflow-hidden px-8 py-10 sm:px-10 sm:py-12"
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/80 via-transparent to-emerald-50/50 dark:from-sky-950/20 dark:to-emerald-950/10"
            aria-hidden
          />
          <div className="relative flex flex-col items-center gap-8 sm:flex-row sm:justify-between sm:gap-12">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {gap.scoredAgainstInternship ? "Target Internship" : "Target Role"}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
                {gap.roleLabel}
              </h3>
              {gap.scoredAgainstInternship && internship?.company?.companyName && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{internship.company.companyName}</p>
              )}
              <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-600 dark:text-slate-400">
                {roleInsight(insightMatch, gap.roleLabel)}
              </p>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Confidence {gap.analysisConfidence}%
              </p>
            </div>
            <MatchProgressRing
              percent={exactMatch}
              showRange={gap.showMatchRange}
              low={rangeLow}
              high={rangeHigh}
            />
          </div>
        </section>
      </ScrollReveal>

      {gap.scoredAgainstInternship ? (
        <>
          {/* B. Required + Preferred skills for this internship */}
          <ScrollReveal variant="fade-up" distance={12}>
            <section className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Required Skills</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {gap.requiredSkillAssessments.filter((a) => a.status === "present").length}/{gap.requiredSkillAssessments.length} present, evidence-based
                </p>
              </div>
              {gap.requiredSkillAssessments.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {gap.requiredSkillAssessments.map((a) => (
                    <SkillCard
                      key={a.normalized}
                      item={{
                        skill: a.normalized,
                        displayName: a.displayName,
                        userLevel: a.proficiency,
                        requiredLevel: 100,
                        status: a.status === "present" ? "strong" : a.status === "partial" ? "partial" : "missing",
                        tier: a.tier,
                        confidence: a.confidence,
                        verified: a.verified,
                        tooltip: a.explanation,
                        selfReportedLevel: a.selfReportedLevel
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className={cn(card, "px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400")}>
                  This internship doesn&apos;t list specific required skills.
                </div>
              )}
            </section>
          </ScrollReveal>

          {gap.preferredSkillAssessments.length > 0 && (
            <ScrollReveal variant="fade-up" distance={12}>
              <section className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Preferred Skills</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Not mandatory, but strengthen your application</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {gap.preferredSkillAssessments.map((a) => (
                    <SkillCard
                      key={a.normalized}
                      item={{
                        skill: a.normalized,
                        displayName: a.displayName,
                        userLevel: a.proficiency,
                        requiredLevel: 100,
                        status: a.status === "present" ? "strong" : a.status === "partial" ? "partial" : "missing",
                        tier: a.tier,
                        confidence: a.confidence,
                        verified: a.verified,
                        tooltip: a.explanation,
                        selfReportedLevel: a.selfReportedLevel
                      }}
                    />
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {gap.additionalValuableSkills.length > 0 && (
            <ScrollReveal variant="fade-up" distance={12}>
              <section className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Additional Valuable Skills</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Skills you have that go beyond this internship&apos;s stated requirements</p>
                <div className="flex flex-wrap gap-2">
                  {gap.additionalValuableSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200/70 bg-slate-50/80 px-3 py-1 text-sm text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}

          {/* C. Education / Experience / Certification requirement checks */}
          <ScrollReveal variant="fade-up" distance={12}>
            <section className="space-y-5">
              <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Requirements Check</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {gap.educationCheck && <RequirementCheckCard title="Education" check={gap.educationCheck} />}
                {gap.experienceCheck && <RequirementCheckCard title="Experience" check={gap.experienceCheck} />}
                {gap.certificationCheck && (
                  <RequirementCheckCard
                    title="Certifications"
                    check={{
                      status: gap.certificationCheck.relevantCertifications.length > 0 ? "match" : "not_stated",
                      score: gap.certificationCheck.score,
                      explanation: gap.certificationCheck.explanation
                    }}
                  />
                )}
              </div>
            </section>
          </ScrollReveal>

          {/* D. Priority-ordered recommended skills */}
          <ScrollReveal variant="fade-up" distance={12}>
            <section className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">Recommended Skills to Learn</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Priority order — why each one matters for this internship</p>
              </div>

              {gap.recommendedSkills.length > 0 ? (
                <div className="space-y-3">
                  {gap.recommendedSkills.map((item) => (
                    <article key={item.skill} className={cn(skillCard, "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between")}>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{item.displayName}</h4>
                          <span className={cn("rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", PRIORITY_BADGE[item.priority])}>
                            {item.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.reason}</p>
                        <a href={item.courseSearchUrl} target="_blank" rel="noreferrer noopener" className="text-link inline-block text-sm">
                          Find courses for {item.displayName}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={cn(card, "px-6 py-10 text-center")}>
                  <p className="text-base text-slate-500 dark:text-slate-400">Strong alignment — no urgent skill gaps for this internship.</p>
                </div>
              )}
            </section>
          </ScrollReveal>
        </>
      ) : (
        <>
          {/* B. Skill Visualization — card grid */}
          <ScrollReveal variant="fade-up" distance={12}>
            <section className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Your Skills
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Top priorities for this role
                </p>
              </div>

              {gap.progressBarsChartValid ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {visibleBars.map((item) => (
                      <SkillCard key={item.skill} item={item} />
                    ))}
                  </div>
                  {gap.progressBars.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowMoreBars((v) => !v)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showMoreBars ? (
                        <>
                          <AppIcon icon={ChevronUp} size="xs" /> Show fewer
                        </>
                      ) : (
                        <>
                          <AppIcon icon={ChevronDown} size="xs" /> Show more skills
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className={cn(card, "px-6 py-12 text-center text-slate-500 dark:text-slate-400")}>
                  {INSUFFICIENT_MSG}
                </div>
              )}
            </section>
          </ScrollReveal>

          {/* C. Quick Wins */}
          <ScrollReveal variant="fade-up" distance={12}>
            <section className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  Quick Wins (Fastest Skill Improvements)
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  High-impact improvements you can start today
                </p>
              </div>

              {quickWins.length > 0 ? (
                <div className="space-y-3">
                  {quickWins.map((item) => (
                    <QuickWinCard key={item.skill} item={item} />
                  ))}
                </div>
              ) : (
                <div className={cn(card, "px-6 py-10 text-center")}>
                  <p className="text-base text-slate-500 dark:text-slate-400">
                    Strong alignment — no urgent quick wins outside your skill cards.
                  </p>
                </div>
              )}
            </section>
          </ScrollReveal>
        </>
      )}
    </div>
  );
}
