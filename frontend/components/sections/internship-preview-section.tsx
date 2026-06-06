import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { featuredInternships } from "@/data/dummy";
import { SectionHeading, SectionShell, HomeCard, HomeButton, SkillChip } from "@/components/home/home-primitives";

export function InternshipPreviewSection() {
  return (
    <SectionShell id="internships">
      <ScrollReveal variant="fade-up" distance={16}>
        <SectionHeading
          eyebrow="Opportunities"
          title="Featured internships"
          description="High-fit opportunities surfaced by AI matching — explore roles companies are actively hiring for."
        />
      </ScrollReveal>

      <ScrollReveal className="mt-10" variant="stagger-children" delayMs={80} staggerMs={75} distance={12}>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredInternships.map((item) => (
            <HomeCard key={item.id} className="flex min-h-[220px] flex-col">
              <p className="text-xs font-semibold uppercase tracking-wider text-internai-blue">{item.company}</p>
              <h3 className="mt-2 text-lg font-bold text-internai-text">{item.role}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-internai-muted">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <SkillChip>{item.location}</SkillChip>
                <SkillChip>{item.mode}</SkillChip>
              </div>
            </HomeCard>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal variant="fade-up" distance={10} delayMs={100} className="mt-10 text-center">
        <HomeButton href="/auth/intern">Explore all internships</HomeButton>
      </ScrollReveal>
    </SectionShell>
  );
}
