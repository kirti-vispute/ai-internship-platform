import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { testimonials } from "@/data/dummy";
import { SectionHeading, SectionShell, HomeCard } from "@/components/home/home-primitives";

export function TestimonialsSection() {
  return (
    <SectionShell id="testimonials">
      <ScrollReveal variant="fade-up" distance={16}>
        <SectionHeading
          eyebrow="Social proof"
          title="What teams are saying"
          description="Interns and recruiters share how InternAI improves readiness, matching quality, and hiring velocity."
        />
      </ScrollReveal>

      <ScrollReveal className="mt-10" variant="stagger-children" delayMs={90} staggerMs={80} distance={12}>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <HomeCard key={item.name} className="flex min-h-[220px] flex-col">
              <p className="flex-1 text-sm leading-7 text-internai-muted">&ldquo;{item.quote}&rdquo;</p>
              <div className="mt-5 border-t border-white/[0.06] pt-4">
                <p className="text-sm font-bold text-internai-text">{item.name}</p>
                <p className="mt-0.5 text-xs text-internai-muted">
                  {item.role} · {item.org}
                </p>
              </div>
            </HomeCard>
          ))}
        </div>
      </ScrollReveal>
    </SectionShell>
  );
}
