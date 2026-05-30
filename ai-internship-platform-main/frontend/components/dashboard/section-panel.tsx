import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

type SectionPanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionPanel({ id, title, subtitle, children, className }: SectionPanelProps) {
  return (
    <ScrollReveal variant="fade-up" distance={14}>
      <section id={id}>
        <Card title={title} subtitle={subtitle} className={className}>
          {children}
        </Card>
      </section>
    </ScrollReveal>
  );
}
