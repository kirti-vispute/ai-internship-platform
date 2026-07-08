"use client";

import { memo, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Brain, Lightbulb, Sparkles, Target, TrendingUp } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { EmptyState } from "@/components/dashboard/empty-state";
import { cn } from "@/lib/utils";
import type { Application, ResumeAnalysis } from "@/lib/intern-portal";
import type { Weakness } from "@/lib/intern-weakness-analysis";

const cardBase =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/60";

type InsightCard = {
  key: string;
  icon: typeof Lightbulb;
  tone: "primary" | "violet" | "emerald" | "sky";
  label: string;
  text: string;
};

const TONE_STYLES: Record<InsightCard["tone"], string> = {
  primary: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300"
};

function buildInsightCards(
  analysis: ResumeAnalysis | null | undefined,
  applications: Application[],
  topWeakness: Weakness | null
): InsightCard[] {
  const cards: InsightCard[] = [];

  const resumeTip = analysis?.criticalIssues?.[0] || analysis?.improvements?.[0];
  if (resumeTip) {
    cards.push({ key: "resume-tip", icon: Lightbulb, tone: "primary", label: "Resume Tip", text: resumeTip });
  }

  const skillGap = analysis?.skillIntelligence?.skillGaps?.[0];
  if (skillGap) {
    cards.push({
      key: "skill-rec",
      icon: Target,
      tone: "sky",
      label: "Skill Recommendation",
      text: `Learn ${skillGap} next to close your top skill gap.`
    });
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weeklyApps = applications.filter((app) => {
    if (!app.appliedAt) return false;
    const applied = new Date(app.appliedAt).getTime();
    return !Number.isNaN(applied) && now - applied <= weekMs;
  }).length;
  if (weeklyApps > 0) {
    cards.push({
      key: "progress",
      icon: TrendingUp,
      tone: "emerald",
      label: "Progress",
      text: `You submitted ${weeklyApps} new application${weeklyApps > 1 ? "s" : ""} this week.`
    });
  }

  if (topWeakness?.suggestion) {
    cards.push({ key: "interview-tip", icon: Brain, tone: "violet", label: "Interview Tip", text: topWeakness.suggestion });
  }

  return cards;
}

function InsightTile({ card, index }: { card: InsightCard; index: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: reducedMotion ? 0 : index * 0.05 }}
      whileHover={{ y: -3 }}
      className={cn(cardBase, "p-4")}
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TONE_STYLES[card.tone])}>
          <AppIcon icon={card.icon} size="sm" className="text-current" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className="mt-1 text-sm leading-snug text-slate-800 dark:text-slate-100">{card.text}</p>
        </div>
      </div>
    </motion.div>
  );
}

function WeeklyAiInsightsInner({
  analysis,
  applications,
  topWeakness
}: {
  analysis: ResumeAnalysis | null | undefined;
  applications: Application[];
  topWeakness: Weakness | null;
}) {
  const cards = useMemo(
    () => buildInsightCards(analysis, applications, topWeakness),
    [analysis, applications, topWeakness]
  );

  if (cards.length === 0) {
    return (
      <ScrollReveal variant="fade-up" distance={12}>
        <div className={cn(cardBase, "p-6")}>
          <div className="mb-4 flex items-center gap-2">
            <AppIcon icon={Sparkles} size="sm" className="text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly AI Insights</h3>
          </div>
          <EmptyState title="No insights yet" hint="Upload a resume and apply to internships to unlock weekly AI insights." icon={Sparkles} />
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Sparkles} size="sm" className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly AI Insights</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => (
            <InsightTile key={card.key} card={card} index={index} />
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

export const WeeklyAiInsights = memo(WeeklyAiInsightsInner);
