import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type SectionPanelProps = {
  id?: string;
  title: string;
  subtitle?: string;
  titleIcon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

export function SectionPanel({ id, title, subtitle, titleIcon, children, className }: SectionPanelProps) {
  return (
    <section id={id}>
      <Card title={title} subtitle={subtitle} titleIcon={titleIcon} className={className}>
        {children}
      </Card>
    </section>
  );
}
