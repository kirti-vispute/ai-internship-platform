import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";

type SummaryStatCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  icon?: LucideIcon;
};

export function SummaryStatCard({ title, value, suffix, hint, icon }: SummaryStatCardProps) {
  return (
    <ScrollReveal variant="fade-up" distance={10}>
      <Card className="ds-stat-card h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="ds-label">{title}</p>
            <p className="ds-stat-value">
              {value}
              {suffix || ""}
            </p>
            {hint && <p className="ds-caption mt-2">{hint}</p>}
          </div>
          {icon ? (
            <span className="ds-stat-icon">
              <AppIcon icon={icon} size="md" />
            </span>
          ) : null}
        </div>
      </Card>
    </ScrollReveal>
  );
}
