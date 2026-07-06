import { LogoMarquee } from "@/components/home/LogoMarquee";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SectionHeading, SectionShell } from "@/components/home/home-primitives";

export function CompanyShowcaseSection() {
  return (
    <SectionShell id="companies" className="py-12 sm:py-16">
      <ScrollReveal variant="soft-scale" distance={12}>
        <SectionHeading
          eyebrow="Hiring partners"
          title="Companies on CareerSetu"
          description="Verified employers use our platform to discover prepared interns and run transparent hiring pipelines."
          align="center"
          className="mx-auto"
        />
      </ScrollReveal>
      <div className="mt-8">
        <LogoMarquee tone="dark" />
      </div>
    </SectionShell>
  );
}
