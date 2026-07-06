"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Wand2
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { InternProfile, ResumeAnalysis } from "@/lib/intern-portal";

const cardBase =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/60";

export type ReadinessTone = "green" | "amber" | "red";

export type Readiness = {
  score: number;
  tone: ReadinessTone;
  emoji: string;
  label: string;
};

const READINESS_STYLES: Record<ReadinessTone, string> = {
  green:
    "border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber:
    "border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  red: "border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300"
};

const READINESS_BAR: Record<ReadinessTone, string> = {
  green: "from-emerald-400 to-emerald-600",
  amber: "from-amber-400 to-amber-600",
  red: "from-rose-400 to-rose-600"
};

/** Reuses the backend-computed recruiterReadiness composite score (already ATS/skill/project-weighted) as the single source of truth for readiness across Hero + Placement Readiness card. */
export function getPlacementReadiness(analysis: ResumeAnalysis | null | undefined, fallbackScore = 0): Readiness {
  const score = Math.round(analysis?.compositeScores?.recruiterReadiness ?? analysis?.overallScore ?? fallbackScore);
  if (score >= 75) return { score, tone: "green", emoji: "\u{1F7E2}", label: "Placement Ready" };
  if (score >= 50) return { score, tone: "amber", emoji: "\u{1F7E1}", label: "Almost Ready" };
  return { score, tone: "red", emoji: "\u{1F534}", label: "Needs Improvement" };
}

export function ReadinessBadge({ readiness, className }: { readiness: Readiness; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
        READINESS_STYLES[readiness.tone],
        className
      )}
    >
      <span aria-hidden>{readiness.emoji}</span>
      {readiness.label}
    </span>
  );
}

function HoverCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(cardBase, "p-6", className)}
    >
      {children}
    </motion.div>
  );
}

function InitialsAvatar({ name }: { name: string }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "IN";

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-violet-500 text-lg font-bold text-white shadow-sm">
      {initials}
    </span>
  );
}

export function DashboardHero({
  profile,
  analysis,
  profileCompletion,
  readiness,
  loading
}: {
  profile: InternProfile | null;
  analysis?: ResumeAnalysis | null;
  profileCompletion: number;
  readiness: Readiness;
  loading?: boolean;
}) {
  if (loading) {
    return <Skeleton className="h-36 w-full rounded-2xl" />;
  }

  const fullName = profile?.fullName || "Intern";
  const firstName = fullName.split(" ")[0];
  const careerTarget = analysis?.skillIntelligence?.targetRole;

  return (
    <ScrollReveal variant="soft-scale" distance={10}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/90 via-white to-violet-50/70 p-6 shadow-sm dark:border-primary-900/40 dark:from-primary-950/30 dark:via-slate-900 dark:to-violet-950/20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <InitialsAvatar name={fullName} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700 dark:text-primary-300">
                Welcome back
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{firstName}</h2>
              {careerTarget ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Targeting <span className="font-semibold text-primary-700 dark:text-primary-300">{careerTarget}</span> roles
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Here&apos;s your placement readiness snapshot for today.
                </p>
              )}
            </div>
          </div>
          <ReadinessBadge readiness={readiness} className="shrink-0 self-start sm:self-center" />
        </div>

        <div className="mt-5 max-w-sm">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Profile Completion</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{profileCompletion}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-700 ease-out"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

function resumeHealthBand(score: number): { label: string; className: string } {
  if (score >= 85) return { label: "Excellent", className: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 70) return { label: "Strong", className: "text-emerald-600 dark:text-emerald-400" };
  if (score >= 55) return { label: "Good", className: "text-amber-600 dark:text-amber-400" };
  if (score >= 40) return { label: "Developing", className: "text-amber-600 dark:text-amber-400" };
  return { label: "Needs Work", className: "text-rose-600 dark:text-rose-400" };
}

export function AtsReadinessCard({
  profile,
  analysis,
  loading
}: {
  profile: InternProfile | null;
  analysis: ResumeAnalysis | null | undefined;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (!profile?.resumeUploaded) {
    return (
      <HoverCard className="text-center">
        <AppIcon icon={FileText} size="md" className="mx-auto text-slate-400" />
        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">No resume yet</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Upload your resume to unlock score, ATS analysis, and AI insights.
        </p>
        <Button href="/dashboard/intern/resume" type="button" size="sm" className="mt-4">
          Upload Resume
        </Button>
      </HoverCard>
    );
  }

  const resumeScore = Math.round(analysis?.overallScore ?? profile.resume?.score ?? 0);
  const atsScore = Math.round(analysis?.categoryScores?.ats ?? analysis?.compositeScores?.ats ?? 0);
  const health = resumeHealthBand(Math.round((resumeScore + atsScore) / 2));

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <HoverCard>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={BarChart3} size="sm" className="text-primary-600 dark:text-primary-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">ATS Readiness</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume Score</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{resumeScore}<span className="text-xs font-medium text-slate-400">/100</span></p>
          </div>
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">ATS Score</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">{atsScore}<span className="text-xs font-medium text-slate-400">/100</span></p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Overall Resume Health</span>
          <span className={cn("text-sm font-bold", health.className)}>{health.label}</span>
        </div>
        <Button href="/dashboard/intern/resume/score" type="button" size="sm" variant="secondary" className="mt-4 w-full gap-1.5">
          Improve Resume
          <span aria-hidden>&rarr;</span>
        </Button>
      </HoverCard>
    </ScrollReveal>
  );
}

type Insight = { text: string; positive: boolean };

function buildInsights(analysis: ResumeAnalysis | null | undefined): Insight[] {
  if (!analysis) return [];
  const positives = (analysis.strengths || []).slice(0, 3).map((text) => ({ text, positive: true }));
  const negatives = [...(analysis.criticalIssues || []), ...(analysis.improvements || [])]
    .slice(0, 3)
    .map((text) => ({ text, positive: false }));
  return [...positives, ...negatives].slice(0, 6);
}

export function AiInsightsCard({
  profile,
  analysis,
  loading
}: {
  profile: InternProfile | null;
  analysis: ResumeAnalysis | null | undefined;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const insights = buildInsights(analysis);

  return (
    <ScrollReveal variant="fade-up" distance={12} delayMs={60}>
      <HoverCard>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Sparkles} size="sm" className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Insights</h3>
        </div>

        {!profile?.resumeUploaded || insights.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {profile?.resumeUploaded
                ? "Analyzing your resume — insights will appear here shortly."
                : "Upload your resume to get AI-generated insights."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {insights.map((insight, idx) => (
              <li key={idx} className="flex gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <AppIcon
                  icon={insight.positive ? CheckCircle2 : AlertTriangle}
                  size="xs"
                  className={cn("mt-0.5 shrink-0", insight.positive ? "text-emerald-500" : "text-amber-500")}
                />
                <span>{insight.text}</span>
              </li>
            ))}
          </ul>
        )}

        <Button href="/dashboard/intern/resume/score" type="button" size="sm" className="mt-4 w-full gap-2">
          <AppIcon icon={Wand2} size="xs" className="text-current" />
          Improve Resume
        </Button>
      </HoverCard>
    </ScrollReveal>
  );
}

export function SkillGapCard({
  analysis,
  loading
}: {
  analysis: ResumeAnalysis | null | undefined;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const skillIntel = analysis?.skillIntelligence;
  const missing = (skillIntel?.skillGaps || []).slice(0, 5);
  const matchPercent = skillIntel?.careerMatch?.matchPercent ?? skillIntel?.overview?.matchPercent ?? 0;

  return (
    <ScrollReveal variant="fade-up" distance={12} delayMs={120}>
      <HoverCard>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Target} size="sm" className="text-sky-600 dark:text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Skill Gap</h3>
        </div>

        {missing.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No major skill gaps detected yet. Upload a resume to see role-matched skill gaps.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Role Match</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{Math.round(matchPercent)}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(2, Math.round(matchPercent))}%` }}
                />
              </div>
            </div>
            <ul className="space-y-2">
              {missing.map((skill, idx) => {
                const priority = idx < 2 ? "High" : idx < 4 ? "Medium" : "Low";
                const dot = priority === "High" ? "bg-rose-500" : priority === "Medium" ? "bg-amber-500" : "bg-sky-500";
                return (
                  <li key={skill} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/70 px-3 py-2 text-sm dark:bg-slate-900/50">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
                      {skill}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {priority}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Button href="/dashboard/intern/skill-gap" type="button" size="sm" variant="secondary" className="mt-4 w-full">
          View Skill Gap Analysis
        </Button>
      </HoverCard>
    </ScrollReveal>
  );
}

function buildReadinessReasons(analysis: ResumeAnalysis | null | undefined): string[] {
  if (!analysis) return [];
  const reasons: string[] = [];

  const overall = analysis.overallScore ?? 0;
  reasons.push(overall >= 70 ? "Resume Score is good" : "Resume Score needs improvement");

  const ats = analysis.categoryScores?.ats ?? analysis.compositeScores?.ats ?? 0;
  if (ats < 70) {
    const atsIssue = (analysis.criticalIssues || []).find((issue) => /ats|keyword/i.test(issue));
    reasons.push(atsIssue || "ATS keywords could be stronger");
  }

  const projectsDimension = analysis.dimensionBreakdown?.find((d) => d.key === "projects");
  if (projectsDimension && projectsDimension.score < 70 && projectsDimension.suggestions?.[0]) {
    reasons.push(projectsDimension.suggestions[0]);
  }

  const topGap = analysis.skillIntelligence?.skillGaps?.[0];
  if (topGap) reasons.push(`Improve ${topGap} proficiency`);

  return reasons.slice(0, 4);
}

export function PlacementReadinessCard({
  readiness,
  analysis,
  loading
}: {
  readiness: Readiness;
  analysis?: ResumeAnalysis | null;
  loading?: boolean;
}) {
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  const reasons = buildReadinessReasons(analysis);

  return (
    <ScrollReveal variant="fade-up" distance={12} delayMs={180}>
      <HoverCard className="flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-2 self-start">
          <AppIcon icon={TrendingUp} size="sm" className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Placement Readiness</h3>
        </div>

        <div className="relative flex h-28 w-28 items-center justify-center">
          <svg width={112} height={112} className="-rotate-90" aria-hidden>
            <circle cx={56} cy={56} r={48} fill="none" strokeWidth={10} className="stroke-slate-100 dark:stroke-slate-800" />
            <circle
              cx={56}
              cy={56}
              r={48}
              fill="none"
              strokeWidth={10}
              strokeLinecap="round"
              className={cn(
                readiness.tone === "green" ? "stroke-emerald-500" : readiness.tone === "amber" ? "stroke-amber-500" : "stroke-rose-500"
              )}
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 - (Math.min(100, Math.max(0, readiness.score)) / 100) * (2 * Math.PI * 48)}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <span className="absolute text-2xl font-black tabular-nums text-slate-900 dark:text-slate-50">{readiness.score}</span>
        </div>

        <ReadinessBadge readiness={readiness} className="mt-4" />

        {reasons.length > 0 ? (
          <ul className="mt-4 w-full space-y-1.5 text-left">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Based on resume quality, ATS fit, project strength, and skill alignment.
          </p>
        )}
      </HoverCard>
    </ScrollReveal>
  );
}
