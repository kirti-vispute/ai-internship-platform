"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCcw, ShieldCheck, Target, TrendingUp } from "lucide-react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import type { InternProfile } from "@/lib/intern-portal";
import {
  analyzeInternshipWeaknesses,
  type Weakness,
  type WeaknessInternshipOption,
  type WeaknessPriority
} from "@/lib/intern-weakness-analysis";

type Props = {
  profile: InternProfile | null;
  options: WeaknessInternshipOption[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

const PRIORITY_BADGE: Record<WeaknessPriority, string> = {
  High: "border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-800/50 dark:bg-rose-950/40 dark:text-rose-300",
  Medium: "border-amber-200/80 bg-amber-50/90 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300",
  Low: "border-sky-200/70 bg-sky-50/80 text-sky-700 dark:border-sky-800/40 dark:bg-sky-950/30 dark:text-sky-300"
};

const PRIORITY_BAR: Record<WeaknessPriority, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-500"
};

const PRIORITY_DOT: Record<WeaknessPriority, string> = {
  High: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-500"
};

function readinessTone(score: number): string {
  if (score >= 75) return "from-emerald-400 to-emerald-600";
  if (score >= 50) return "from-amber-400 to-amber-600";
  return "from-rose-400 to-rose-600";
}

function MetricTile({
  icon,
  label,
  value,
  hint
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-subtle flex items-start gap-3 px-4 py-3">
      <AppIcon icon={icon} className="mt-0.5 text-primary-600 dark:text-primary-400" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{value}</p>
        {hint ? <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}

function WeaknessCard({ weakness }: { weakness: Weakness }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300/70 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] dark:border-slate-800/60 dark:bg-slate-900/50 dark:hover:border-slate-700/60">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[weakness.priority])} />
          {weakness.category}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
            PRIORITY_BADGE[weakness.priority]
          )}
        >
          {weakness.priority}
        </span>
      </div>

      <h4 className="mt-3 flex items-start gap-1.5 text-base font-semibold leading-snug text-slate-800 dark:text-slate-100">
        <span aria-hidden className="mt-0.5 shrink-0 text-rose-500">
          ✕
        </span>
        <span className="min-w-0">{weakness.title}</span>
      </h4>

      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{weakness.explanation}</p>

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Why it matters</dt>
          <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{weakness.whyItMatters}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Suggestion</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{weakness.suggestion}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-slate-500">
          <span>Severity</span>
          <span className="tabular-nums">{weakness.severity}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", PRIORITY_BAR[weakness.priority])}
            style={{ width: `${weakness.severity}%` }}
          />
        </div>
      </div>
    </article>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function WeaknessAnalysisPanel({ profile, options, loading = false, error = null, onRetry }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");

  // Keep the selection valid as options load/change; default to the first role.
  useEffect(() => {
    if (options.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!options.some((o) => o.id === selectedId)) {
      setSelectedId(options[0].id);
    }
  }, [options, selectedId]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === selectedId) || null,
    [options, selectedId]
  );

  // Pure derivation keyed on the selected internship — recomputes instantly on
  // change, so results are always specific to the chosen role (never stale).
  const analysis = useMemo(
    () => analyzeInternshipWeaknesses(profile, selectedOption),
    [profile, selectedOption]
  );

  const selector =
    options.length > 0 && !error ? (
      <select
        aria-label="Select internship position"
        className="ds-input ds-select h-10 max-w-[16rem] text-sm"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.role} · {option.company}
            {option.source === "applied" ? " (Applied)" : ""}
          </option>
        ))}
      </select>
    ) : undefined;

  return (
    <SectionPanel
      id="dashboard-weakness-analysis"
      title="Weakness Analysis"
      subtitle="Personalised, internship-specific gaps and how to close them."
      titleIcon={Target}
    >
      <div className="space-y-5">
        {selector ? <div className="flex flex-wrap items-center justify-end gap-2">{selector}</div> : null}

        {loading ? (
          <PanelSkeleton />
        ) : error ? (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 px-6 py-10 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
            <AppIcon icon={AlertTriangle} size="md" className="mx-auto text-rose-500" />
            <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
              Couldn&apos;t load weakness analysis
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{error}</p>
            {onRetry ? (
              <Button type="button" size="sm" variant="secondary" className="mt-4 gap-2" onClick={onRetry}>
                <AppIcon icon={RefreshCcw} size="xs" className="text-current" />
                Retry
              </Button>
            ) : null}
          </div>
        ) : options.length === 0 || !analysis ? (
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 px-6 py-12 text-center dark:border-slate-800/60 dark:bg-slate-900/40">
            <AppIcon icon={Target} size="md" className="mx-auto text-primary-500" />
            <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">No internship selected yet</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Apply to internships or explore recommendations to see role-specific weaknesses.
            </p>
            <Button href="/dashboard/intern/internships/search" type="button" size="sm" variant="secondary" className="mt-4">
              Browse Internships
            </Button>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                icon={Target}
                label="Skill Match"
                value={`${analysis.matchPercent}%`}
                hint={`${analysis.role}`}
              />
              <MetricTile
                icon={AlertTriangle}
                label="Missing Skills"
                value={String(analysis.missingSkillCount)}
                hint="Required + preferred"
              />
              <MetricTile
                icon={ShieldCheck}
                label="Weaknesses"
                value={String(analysis.weaknesses.length)}
                hint={`${analysis.byPriority.High} high · ${analysis.byPriority.Medium} med · ${analysis.byPriority.Low} low`}
              />
              <MetricTile
                icon={TrendingUp}
                label="Improvement Room"
                value={`${analysis.improvementPotential}%`}
                hint={`Readiness ${analysis.readinessScore}%`}
              />
            </div>

            {/* Readiness progress bar */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 dark:border-slate-800/60 dark:bg-slate-900/50">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Readiness for this role</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {analysis.readinessScore}%
                </span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out",
                    readinessTone(analysis.readinessScore)
                  )}
                  style={{ width: `${analysis.readinessScore}%` }}
                />
              </div>
            </div>

            {/* Weakness cards */}
            {analysis.weaknesses.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 px-6 py-12 text-center dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <AppIcon icon={ShieldCheck} size="md" className="mx-auto text-emerald-500" />
                <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
                  You&apos;re strongly aligned with this role
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  No significant weaknesses detected. Keep your profile and projects up to date.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {analysis.weaknesses.map((weakness) => (
                  <WeaknessCard key={weakness.id} weakness={weakness} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SectionPanel>
  );
}
