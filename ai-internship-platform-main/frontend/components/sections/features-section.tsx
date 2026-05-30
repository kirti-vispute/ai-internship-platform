import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { EqualHeightCardGrid } from "@/components/home/EqualHeightCardGrid";
import { features } from "@/data/dummy";

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-shell">
        <ScrollReveal variant="fade-up" distance={16} className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Product Capabilities</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
            Core platform intelligence that improves candidate readiness and internship hiring outcomes.
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-8" variant="stagger-children" delayMs={100} distance={14} staggerMs={90}>
          <EqualHeightCardGrid
            items={features.map((item, index) => ({
              title: item.title,
              description: item.description,
              accent: index === 2 ? "emerald" : index % 2 === 0 ? "cyan" : "indigo"
            }))}
            minHeightClassName="min-h-[210px]"
            gridClassName="md:grid-cols-3"
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
