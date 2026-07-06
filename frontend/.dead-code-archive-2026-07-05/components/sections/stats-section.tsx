import { stats } from "@/data/dummy";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AnimatedCounter } from "@/components/home/AnimatedCounter";
import { SectionHeading, SectionShell, HomeCard } from "@/components/home/home-primitives";

export function StatsSection() {
  return (
    <SectionShell className="py-12 sm:py-16">
      <ScrollReveal variant="fade-up" distance={14}>
        <SectionHeading
          eyebrow="Platform momentum"
          title="Trusted by interns and companies"
          description="Ecosystem growth across active students, verified employers, open internships, and successful placements."
          align="center"
          className="mx-auto"
        />
      </ScrollReveal>

      <ScrollReveal className="mt-10" variant="stagger-children" delayMs={80} staggerMs={70} distance={10}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <HomeCard key={stat.label} className="flex min-h-[140px] flex-col justify-between text-center sm:text-left">
              <p className="text-3xl font-bold tabular-nums text-internai-text sm:text-4xl">
                <AnimatedCounter value={stat.value} />
              </p>
              <p className="mt-2 text-sm text-internai-muted">{stat.label}</p>
              <span
                className={`mt-4 mx-auto sm:mx-0 h-0.5 w-10 rounded-full ${index % 2 === 0 ? "bg-internai-blue/80" : "bg-internai-green/70"}`}
                aria-hidden
              />
            </HomeCard>
          ))}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}
