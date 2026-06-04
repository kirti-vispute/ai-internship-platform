import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { EqualHeightCardGrid, type GridItem } from "@/components/home/EqualHeightCardGrid";

const whyInternAIItems: GridItem[] = [
  {
    title: "Role-based dashboards",
    description: "Dedicated intern and company workspaces keep every action contextual, focused, and easy to track.",
    accent: "cyan"
  },
  {
    title: "Verification-first trust layer",
    description: "Company verification and transparent workflow states build reliability into every internship interaction.",
    accent: "blue"
  },
  {
    title: "Continuous AI insights",
    description: "Resume, skill, and application intelligence keep improving recommendations across the full hiring journey.",
    accent: "indigo"
  }
];

export function WhyChooseSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-shell">
        <ScrollReveal variant="slide-right" distance={18} className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Why InternAI stands out</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
            Built for outcome-focused internship matching with consistency, trust, and intelligent iteration.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-8" variant="stagger-children" delayMs={100} staggerMs={90} distance={14}>
          <EqualHeightCardGrid items={whyInternAIItems} minHeightClassName="min-h-[210px]" gridClassName="md:grid-cols-3" />
        </ScrollReveal>
      </div>
    </section>
  );
}
