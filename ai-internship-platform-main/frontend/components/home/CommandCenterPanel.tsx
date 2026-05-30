"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { TiltCard } from "@/components/dashboard/TiltCard";

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
              ? "border-cyan-300/45 bg-gradient-to-b from-cyan-100/55 to-white p-5 shadow-[0_14px_34px_rgba(14,165,233,0.2)] dark:border-cyan-400/35 dark:from-cyan-900/20 dark:to-slate-900"
              : "bg-gradient-to-b from-white to-slate-50 p-5 dark:from-slate-900 dark:to-slate-900/80"
          }
        >
          <div className="mb-3 flex items-center justify-end">
            <span
              className={
                index === 0
                  ? "h-2.5 w-2.5 rounded-full bg-cyan-500/80"
                  : index === 1
                    ? "h-2.5 w-2.5 rounded-full bg-blue-500/80"
                    : "h-2.5 w-2.5 rounded-full bg-indigo-500/80"
              }
            />
          </div>
          <h3 className="mt-2 text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{item.body}</p>
        </TiltCard>
      ))}
    </ScrollReveal>
  );
}
