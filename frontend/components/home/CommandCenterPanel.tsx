"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TiltCard } from "@/components/dashboard/shared/TiltCard";

const commandItems = [
  {
    title: "Resume Score Intelligence",
    body: "Model-backed scoring with ATS compatibility signals to prioritize interview-ready profiles.",
    tone: "standard"
  },
  {
    title: "Skill Gap Mapping",
    body: "AI highlights missing role skills and routes interns to focused learning before applying.",
    tone: "standard"
  },
  {
    title: "Verified Hiring Workflow",
    body: "Trusted companies, stage tracking, and recommendation confidence in one transparent pipeline.",
    tone: "accent"
  }
] as const;

export function CommandCenterPanel() {
  return (
    <ScrollReveal variant="stagger-children" className="grid gap-4 md:grid-cols-3" staggerMs={90}>
      {commandItems.map((item, index) => (
        <TiltCard
          key={item.title}
          className={
            item.tone === "accent"
              ? "border-[var(--ds-primary)]/45 bg-gradient-to-b from-[var(--ds-info-bg)] to-[var(--ds-card)] p-5 shadow-[0_14px_34px_rgba(14,165,233,0.2)]"
              : "bg-gradient-to-b from-[var(--ds-card)] to-[var(--ds-surface)] p-5"
          }
        >
          <div className="mb-3 flex items-center justify-end">
            <span
              className={
                index === 0
                  ? "h-2.5 w-2.5 rounded-full bg-[var(--ds-chart-1)]/80"
                  : index === 1
                    ? "h-2.5 w-2.5 rounded-full bg-[var(--ds-chart-2)]/80"
                    : "h-2.5 w-2.5 rounded-full bg-[var(--ds-chart-3)]/80"
              }
            />
          </div>
          <h3 className="mt-2 text-lg font-bold leading-tight text-[var(--ds-text)]">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--ds-text-secondary)]">{item.body}</p>
        </TiltCard>
      ))}
    </ScrollReveal>
  );
}
