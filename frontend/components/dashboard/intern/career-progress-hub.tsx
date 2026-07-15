"use client";

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, Circle, Rocket } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import type { InternProfile, ResumeAnalysis } from "@/lib/intern-portal";
import type { Readiness } from "@/components/dashboard/intern/dashboard-overview-cards";

const cardBase =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/60";

type Milestone = {
  key: string;
  label: string;
  done: boolean;
};

function buildMilestones(
  profile: InternProfile | null,
  analysis: ResumeAnalysis | null | undefined,
  readiness: Readiness
): Milestone[] {
  const atsScore = Math.round(analysis?.categoryScores?.ats ?? analysis?.compositeScores?.ats ?? 0);

  return [
    { key: "resume", label: "Resume Completed", done: Boolean(profile?.resumeUploaded) },
    { key: "portfolio", label: "Portfolio Ready", done: Boolean(profile?.portfolioUrl) },
    { key: "ats", label: "ATS Optimized", done: atsScore >= 70 },
    { key: "skills", label: "Skills Added", done: (profile?.skills?.length ?? 0) > 0 },
    { key: "projects", label: "Projects Added", done: (profile?.projects?.length ?? 0) > 0 },
    { key: "interview", label: "Interview Ready", done: readiness.score >= 50 },
    { key: "placement", label: "Placement Ready", done: readiness.tone === "green" }
  ];
}

function MilestoneChip({ milestone, index }: { milestone: Milestone; index: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: reducedMotion ? 0 : index * 0.04 }}
      whileHover={{ y: -2 }}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-3",
        milestone.done
          ? "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/30"
          : "border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50"
      )}
    >
      <AppIcon
        icon={milestone.done ? CheckCircle2 : Circle}
        size="sm"
        className={cn("shrink-0", milestone.done ? "text-emerald-500" : "text-slate-300 dark:text-slate-600")}
      />
      <span
        className={cn(
          "text-sm font-medium",
          milestone.done ? "text-emerald-800 dark:text-emerald-200" : "text-slate-500 dark:text-slate-400"
        )}
      >
        {milestone.label}
      </span>
    </motion.div>
  );
}

function CareerProgressHubInner({
  profile,
  analysis,
  readiness
}: {
  profile: InternProfile | null;
  analysis: ResumeAnalysis | null | undefined;
  readiness: Readiness;
}) {
  const milestones = useMemo(() => buildMilestones(profile, analysis, readiness), [profile, analysis, readiness]);
  const completedCount = milestones.filter((m) => m.done).length;
  const percent = Math.round((completedCount / milestones.length) * 100);

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AppIcon icon={Rocket} size="sm" className="text-primary-600 dark:text-primary-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Career Progress</h3>
          </div>
          <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {completedCount}/{milestones.length} milestones &middot; {percent}%
          </span>
        </div>

        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, percent)}%` }}
          />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {milestones.map((milestone, index) => (
            <MilestoneChip key={milestone.key} milestone={milestone} index={index} />
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

export const CareerProgressHub = memo(CareerProgressHubInner);
