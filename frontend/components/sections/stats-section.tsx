import { stats } from "@/data/dummy";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { EqualHeightCardGrid } from "@/components/home/EqualHeightCardGrid";
import { SectionAnimator } from "@/components/home/SectionAnimator";

const trustedCompanies = ["Acme Labs", "NovaTech", "OrbitWorks", "PixelForge", "CloudNest"];

export function StatsSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell">
        <div className="rounded-3xl bg-slateDeep p-6 text-white shadow-[0_24px_60px_rgba(2,6,23,0.5)] sm:p-10 dark:bg-slate-900">
          <SectionAnimator revealVariant="zoom-in" distance={20} parallax={10}>
            <p className="text-xs uppercase tracking-widest text-cyan-200/90">Verified Ecosystem</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Trusted by interns and companies building future-ready teams
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Ecosystem momentum across active intern profiles, trusted companies, and hiring pipeline performance.
            </p>
          </SectionAnimator>

          <ScrollReveal className="mt-4 flex flex-wrap gap-2" variant="slide-right" distance={16} delayMs={70}>
            {trustedCompanies.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/85 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                {name}
              </span>
            ))}
          </ScrollReveal>

          <ScrollReveal className="mt-5" variant="stagger-children" delayMs={120} staggerMs={80} distance={12}>
            <EqualHeightCardGrid
              tone="dark"
              gridClassName="sm:grid-cols-2 lg:grid-cols-4"
              minHeightClassName="min-h-[156px]"
              titleClassName="text-2xl font-black text-white"
              descriptionClassName="text-sm text-white/75"
              items={stats.map((stat, index) => ({
                title: stat.value,
                description: stat.label,
                accent: index % 2 === 0 ? "cyan" : "blue"
              }))}
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
