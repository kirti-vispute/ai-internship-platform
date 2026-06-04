"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Layers,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import type { InternProfile, ResumeAnalysis } from "@/lib/intern-portal";
import { cn } from "@/lib/utils";

const TARGET_ROLES = [
  { key: "full_stack_developer", label: "Full Stack Developer" },
  { key: "frontend_developer", label: "Frontend Developer" },
  { key: "backend_developer", label: "Backend Developer" },
  { key: "data_scientist", label: "Data Scientist" },
  { key: "ai_ml_engineer", label: "AI / ML Engineer" }
] as const;

type Props = {
  profile: InternProfile | null;
  analysis: ResumeAnalysis | null | undefined;
  onTargetRoleChange?: (roleKey: string) => void;
  loadingRole?: boolean;
};

const cardBase =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/60";

const cardHover =
  "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.28)] dark:hover:border-slate-700";

function scoreBand(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 40) return "Developing";
  return "Needs work";
}

function ScoreRing({ value, size = 168, stroke = 12 }: { value: number; size?: number; stroke?: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="score-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(14 165 233)" />
            <stop offset="100%" stopColor="rgb(6 182 212)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#score-ring-gradient)"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tight text-slate-900 tabular-nums dark:text-slate-50">{clamped}</span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

function InsightPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
      <span className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">{Math.round(value)}</span>
      <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

function MetricBar({ label, score }: { label: string; score: number }) {
  const width = Math.max(2, Math.min(100, Math.round(score)));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{Math.round(score)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 dark:from-sky-400 dark:to-cyan-400"
          style={{ width: `${width}%`, transition: "width 800ms cubic-bezier(0.22,1,0.36,1)" }}
        />
      </div>
    </div>
  );
}

function InsightCard({
  title,
  icon,
  items,
  accent
}: {
  title: string;
  icon: LucideIcon;
  items: string[];
  accent: "emerald" | "sky" | "rose";
}) {
  if (!items.length) return null;
  const accents = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    sky: "text-sky-600 dark:text-sky-400",
    rose: "text-rose-600 dark:text-rose-400"
  };
  const dot = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    rose: "bg-rose-500"
  };
  return (
    <div className={cn(cardBase, cardHover, "p-6")}>
      <div className="mb-4 flex items-center gap-2">
        <AppIcon icon={icon} size="sm" className={accents[accent]} />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {items.slice(0, 5).map((item, idx) => (
          <li key={`${title}-${idx}`} className="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dot[accent])} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LevelDots({ filled, tone }: { filled: number; tone: "muted" | "accent" }) {
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i < filled
              ? tone === "accent"
                ? "bg-sky-500 dark:bg-sky-400"
                : "bg-slate-400 dark:bg-slate-500"
              : "bg-slate-200 dark:bg-slate-700"
          )}
        />
      ))}
    </span>
  );
}

function gapSuggestion(skill: string, learning?: string[]) {
  const match = learning?.find((tip) => tip.toLowerCase().includes(skill.toLowerCase()));
  if (match) return match;
  return `Add a project or certification that demonstrates ${skill}.`;
}

function SkillGapCard({ skill, suggestion }: { skill: string; suggestion: string }) {
  return (
    <div className={cn(cardBase, cardHover, "p-5")}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{skill}</h4>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Gap
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Current</span>
          <LevelDots filled={0} tone="muted" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Required</span>
          <LevelDots filled={5} tone="accent" />
        </div>
      </div>

      <p className="mt-4 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{suggestion}</p>
    </div>
  );
}

export function ResumeIntelligenceDashboard({ profile, analysis, onTargetRoleChange, loadingRole }: Props) {
  const [targetRole, setTargetRole] = useState(
    analysis?.skillIntelligence?.targetRoleKey || "full_stack_developer"
  );

  const composite = analysis?.compositeScores;
  const skillIntel = analysis?.skillIntelligence;
  const overall = composite?.overall ?? analysis?.overallScore ?? profile?.resume?.score ?? 0;

  const categoryEntries = useMemo(() => {
    if (!skillIntel?.categorized) return [];
    return Object.entries(skillIntel.categorized).filter(([, skills]) => skills.length > 0);
  }, [skillIntel?.categorized]);

  const skillGaps = useMemo(() => {
    const gaps = skillIntel?.skillGaps?.length ? skillIntel.skillGaps : skillIntel?.careerMatch?.missingSkills || [];
    return gaps.slice(0, 8);
  }, [skillIntel?.skillGaps, skillIntel?.careerMatch?.missingSkills]);

  const breakdown = useMemo(
    () =>
      [
        { label: "ATS Compatibility", score: composite?.ats ?? analysis?.categoryScores?.ats ?? 0 },
        { label: "Technical Strength", score: composite?.technicalStrength ?? 0 },
        { label: "Project Strength", score: composite?.projectStrength ?? 0 },
        { label: "Skill Strength", score: composite?.skillStrength ?? 0 },
        { label: "Recruiter Readiness", score: composite?.recruiterReadiness ?? 0 },
        { label: "Profile Completeness", score: composite?.profileCompleteness ?? 0 }
      ].filter((row) => row.score > 0),
    [composite, analysis?.categoryScores?.ats]
  );

  if (!profile?.resumeUploaded) {
    return (
      <div className={cn(cardBase, "px-6 py-12 text-center")}>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <AppIcon icon={Sparkles} size="md" className="text-sky-500" />
        </span>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Upload your resume to unlock AI-powered resume intelligence and skill gap analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Resume Intelligence</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            ATS-weighted analysis · {analysis?.intelligenceVersion === "v2" ? "Structured engine active" : "Refresh score for V2"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="target-role" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Career target
          </label>
          <select
            id="target-role"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            value={targetRole}
            disabled={loadingRole}
            onChange={(e) => {
              setTargetRole(e.target.value);
              onTargetRoleChange?.(e.target.value);
            }}
          >
            {TARGET_ROLES.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resume Score — centered hero */}
      <ScrollReveal variant="soft-scale" distance={12}>
        <div className={cn(cardBase, "px-6 py-10 sm:px-10")}>
          <div className="flex flex-col items-center text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Your Resume Score
            </p>
            <div className="mt-6">
              <ScoreRing value={overall} />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
              {scoreBand(overall)} — overall resume strength for your target role
            </p>

            <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3">
              <InsightPill label="ATS" value={composite?.ats ?? analysis?.categoryScores?.ats ?? 0} />
              <InsightPill label="Technical" value={composite?.technicalStrength ?? 0} />
              <InsightPill label="Recruiter" value={composite?.recruiterReadiness ?? 0} />
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Score breakdown + insights */}
      {(breakdown.length > 0 || (analysis?.strengths?.length ?? 0) > 0) && (
        <ScrollReveal variant="fade-up" distance={14}>
          <div className="grid gap-5 lg:grid-cols-2">
            {breakdown.length > 0 && (
              <div className={cn(cardBase, cardHover, "p-6")}>
                <div className="mb-5 flex items-center gap-2">
                  <AppIcon icon={TrendingUp} size="sm" className="text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Score Breakdown</h3>
                </div>
                <div className="space-y-4">
                  {breakdown.map((row) => (
                    <MetricBar key={row.label} label={row.label} score={row.score} />
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-5">
              <InsightCard title="Strengths" icon={CheckCircle2} items={analysis?.strengths || []} accent="emerald" />
              <InsightCard title="Recommendations" icon={Lightbulb} items={analysis?.improvements || []} accent="sky" />
              <InsightCard title="Critical Issues" icon={AlertTriangle} items={analysis?.criticalIssues || []} accent="rose" />
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Skill Gap Analysis */}
      <ScrollReveal variant="fade-up" distance={14}>
        <section className="space-y-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Skill Gap Analysis</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {skillIntel?.targetRole ? `Benchmarked against ${skillIntel.targetRole}` : "Benchmarked against your career target"}
              </p>
            </div>
            {typeof skillIntel?.careerMatch?.matchPercent === "number" && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200/70 bg-slate-50/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                <AppIcon icon={Target} size="xs" className="text-sky-500" />
                {skillIntel.careerMatch.matchPercent}% role match
              </span>
            )}
          </div>

          {/* Gap cards */}
          {skillGaps.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {skillGaps.map((skill) => (
                <SkillGapCard key={skill} skill={skill} suggestion={gapSuggestion(skill, skillIntel?.learningRecommendations)} />
              ))}
            </div>
          ) : (
            <div className={cn(cardBase, "flex items-center gap-3 px-6 py-5")}>
              <AppIcon icon={CheckCircle2} size="sm" className="text-emerald-500" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No major skill gaps detected for this target role. Keep your resume current to maintain alignment.
              </p>
            </div>
          )}

          {/* Skills grouped by category */}
          {categoryEntries.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AppIcon icon={Layers} size="sm" className="text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Your Skills by Category</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryEntries.map(([category, skills]) => (
                  <div key={category} className={cn(cardBase, cardHover, "p-5")}>
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{category}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {skills.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg border border-slate-200/70 bg-slate-50/70 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-sky-500/50 dark:hover:bg-sky-950/30 dark:hover:text-sky-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning path */}
          {(skillIntel?.learningRecommendations || []).length > 0 && (
            <div className={cn(cardBase, cardHover, "p-6")}>
              <div className="mb-4 flex items-center gap-2">
                <AppIcon icon={GraduationCap} size="sm" className="text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggested Learning Path</h3>
              </div>
              <ul className="space-y-2.5">
                {(skillIntel?.learningRecommendations || []).slice(0, 5).map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </ScrollReveal>

      {analysis?.quality && !analysis.quality.isReliable && (
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 px-5 py-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">
            Analysis confidence: {Math.round((analysis.confidence ?? analysis.quality.confidence) * 100)}%
          </p>
          <p className="mt-1">Improve extraction quality: {(analysis.quality.issues || []).join(" ")}</p>
        </div>
      )}
    </div>
  );
}
