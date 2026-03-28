"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

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
    <ScrollReveal delayMs={170} variant="soft-scale" distance={16}>
      <div className="relative z-20">
        <div className="pointer-events-none absolute -top-5 right-6 h-20 w-20 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-4 left-8 h-16 w-16 rounded-full bg-indigo-400/18 blur-3xl" />

        <aside
          data-cursor="card"
          className="tilt-3d grid-pattern relative rounded-3xl border border-slate-700/85 bg-slate-900/82 p-6 shadow-[0_24px_62px_rgba(2,6,23,0.62)] backdrop-blur-xl"
          aria-label="AI Internship Command Center"
        >
          <header className="mb-4 border-b border-slate-700/80 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200">AI Internship Command Center</p>
            <h3 className="mt-2 text-xl font-bold leading-tight text-slate-100">Live Hiring Intelligence</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Unified insight layer for resume quality, skill readiness, verified opportunities, and candidate progression.
            </p>
          </header>

          <ScrollReveal variant="stagger-children" className="space-y-3" staggerMs={95}>
            {commandItems.map((item) => (
              <section
                key={item.title}
                className={
                  item.tone === "accent"
                    ? "rounded-2xl border border-cyan-400/35 bg-cyan-500/10 p-4 shadow-[0_12px_28px_rgba(14,165,233,0.25)]"
                    : "rounded-2xl border border-slate-700/90 bg-slate-900/90 p-4 shadow-[0_10px_24px_rgba(2,6,23,0.45)]"
                }
              >
                <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">{item.body}</p>
              </section>
            ))}
          </ScrollReveal>
        </aside>
      </div>
    </ScrollReveal>
  );
}

