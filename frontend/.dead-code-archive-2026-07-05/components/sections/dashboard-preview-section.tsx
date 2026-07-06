"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { BarChart3, Briefcase, Sparkles, Target } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { SectionHeading, SectionShell, HomeCard, HomeProgressBar, AiInsightBadge } from "@/components/home/home-primitives";

const previewWidgets = [
  { label: "Resume Score", value: 87, icon: Target },
  { label: "Role Match", value: 92, icon: Sparkles },
  { label: "Applications", value: 14, icon: Briefcase, suffix: " active" },
  { label: "Skill Strength", value: 78, icon: BarChart3 }
];

export function DashboardPreviewSection() {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0.15, 0.45], reducedMotion ? [1, 1] : [0.96, 1]);
  const y = useTransform(scrollYProgress, [0.15, 0.45], reducedMotion ? [0, 0] : [28, 0]);

  return (
    <SectionShell id="dashboard-preview">
      <ScrollReveal variant="fade-up" distance={16}>
        <SectionHeading
          eyebrow="Platform preview"
          title="Your career command center"
          description="A calm, intelligent dashboard — resume intelligence, applications, and hiring progress in one focused workspace."
        />
      </ScrollReveal>

      <motion.div ref={ref} style={{ scale, y }} className="mt-10">
        <div className="internai-glass overflow-hidden rounded-3xl border border-white/[0.08] p-1 shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-internai-green/80" />
            <span className="ml-2 text-xs font-medium text-internai-muted">CareerSetu · Dashboard</span>
          </div>

          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.2fr_1fr]">
            <HomeCard className="border-internai-blue/20 bg-internai-elevated/50">
              <AiInsightBadge>AI insight</AiInsightBadge>
              <h3 className="mt-4 text-xl font-bold text-internai-text">Resume intelligence</h3>
              <p className="mt-2 text-sm text-internai-muted">ATS score, skill gaps, and improvement paths — updated in real time.</p>
              <div className="mt-6 space-y-4">
                <HomeProgressBar label="ATS readiness" value={87} />
                <HomeProgressBar label="Technical depth" value={78} />
                <HomeProgressBar label="Profile completeness" value={94} />
              </div>
            </HomeCard>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {previewWidgets.map((widget, index) => (
                <ScrollReveal key={widget.label} variant="fade-up" delayMs={index * 60} distance={10}>
                  <HomeCard className="flex flex-col justify-between p-5">
                    <div className="flex items-center justify-between">
                      <AppIcon icon={widget.icon} size="sm" className="text-internai-blue" />
                      <span className="text-2xl font-bold tabular-nums text-internai-text">
                        {widget.value}
                        {widget.suffix || "%"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-internai-muted">{widget.label}</p>
                  </HomeCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </SectionShell>
  );
}
