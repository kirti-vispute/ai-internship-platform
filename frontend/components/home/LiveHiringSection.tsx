import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { EqualHeightCardGrid, type GridItem } from "@/components/home/EqualHeightCardGrid";

const liveHiringItems: GridItem[] = [
  {
    title: "Resume Score Intelligence",
    description: "Model-backed score drivers show profile strength, ATS readiness, and interview potential in real time.",
    accent: "cyan"
  },
  {
    title: "Skill Gap Mapping",
    description: "AI surfaces missing role skills and maps practical next-step learning paths before application submission.",
    accent: "blue"
  },
  {
    title: "Verified Hiring Workflow",
    description: "Trusted company matching with transparent hiring stages, recommendation confidence, and pipeline visibility.",
    accent: "emerald"
  }
] as const;

export function LiveHiringSection() {
  return (
    <section className="pb-12 pt-4 sm:pb-16 sm:pt-6">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/85 bg-white/92 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/82 dark:shadow-[0_22px_48px_rgba(2,6,23,0.55)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full bg-cyan-300/24 blur-3xl dark:bg-cyan-500/14" />
          <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-indigo-300/22 blur-3xl dark:bg-indigo-500/14" />

          <ScrollReveal variant="clip-reveal" className="relative z-10 max-w-3xl" distance={20}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">Live Hiring Intelligence</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Real-time modules for scoring, skill mapping, and verified hiring workflows.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              A clean control layer connecting intern readiness signals to trusted company matching and hiring pipeline outcomes.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="stagger-children" delayMs={70} staggerMs={90} className="relative z-10 mt-4" distance={12}>
            <EqualHeightCardGrid items={liveHiringItems} />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
