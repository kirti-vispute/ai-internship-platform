import { Card } from "@/components/ui/card";

type SectionPanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionPanel({ id, title, subtitle, children, className }: SectionPanelProps) {
  return (
    <section id={id}>
      <Card title={title} subtitle={subtitle} className={className}>
        {children}
      </Card>
    </section>
  );
}
