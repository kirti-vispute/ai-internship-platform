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
    <section className="py-20 sm:py-24">
      <div className="container-shell">
        <ScrollReveal variant="fade-up" distance={16} className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Live Hiring Intelligence
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
            Real-time AI modules that evaluate, guide, and accelerate internship hiring.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="stagger-children" delayMs={90} staggerMs={90} className="mt-8" distance={12}>
          <EqualHeightCardGrid
            items={liveHiringItems}
            minHeightClassName="min-h-[210px]"
            gridClassName="md:grid-cols-3"
            cardClassName="rounded-2xl"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
