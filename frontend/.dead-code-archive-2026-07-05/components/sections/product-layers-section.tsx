import Link from "next/link";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SectionHeading, SectionShell, HomeCard } from "@/components/home/home-primitives";

const layers = [
  {
    id: "student",
    label: "Student layer",
    title: "Resume, gaps & learning",
    description: "Three focused areas — never mixed on one screen.",
    items: [
      { name: "Resume score", detail: "One score and one line of guidance." },
      { name: "Skill gaps", detail: "Gaps to close for your target role." },
      { name: "Learning path", detail: "Curated courses and certifications." }
    ],
    href: "/auth/intern",
    cta: "Open student portal"
  },
  {
    id: "company",
    label: "Company layer",
    title: "Hiring & candidate fit",
    description: "Match, evaluate, and shortlist — without metric overload.",
    items: [
      { name: "Candidate matching", detail: "See who fits your open roles." },
      { name: "Skill filtering", detail: "Filter by skills that matter." },
      { name: "Profile summary", detail: "One clear evaluation per applicant." }
    ],
    href: "/auth/company",
    cta: "Open company portal"
  },
  {
    id: "coach",
    label: "AI coach layer",
    title: "Guidance only",
    description: "Light suggestions for what to do next — not another dashboard.",
    items: [
      { name: "Next step", detail: "One recommended action at a time." },
      { name: "Focus areas", detail: "Short tips tied to your goals." },
      { name: "No analytics wall", detail: "Guidance without clutter." }
    ],
    href: "/auth/intern",
    cta: "See guidance"
  }
] as const;

export function ProductLayersSection() {
  return (
    <SectionShell id="product" className="bg-slate-50/80">
      <ScrollReveal variant="fade-up" distance={8} once>
        <SectionHeading
          eyebrow="Product structure"
          title="Three layers. One purpose each."
          description="Structured like a professional career platform — clear separation between student tools, company hiring, and AI guidance."
        />
      </ScrollReveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {layers.map((layer, index) => (
          <ScrollReveal key={layer.id} variant="fade-up" distance={8} delayMs={index * 60} once>
            <HomeCard className="flex h-full flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">{layer.label}</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{layer.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{layer.description}</p>
              <ul className="mt-5 flex-1 space-y-3 border-t border-slate-100 pt-5">
                {layer.items.map((item) => (
                  <li key={item.name}>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{item.detail}</p>
                  </li>
                ))}
              </ul>
              <Link href={layer.href} className="portal-btn-secondary mt-6 w-full justify-center text-center">
                {layer.cta}
              </Link>
            </HomeCard>
          </ScrollReveal>
        ))}
      </div>
    </SectionShell>
  );
}
