import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

export type StatTone = "blue" | "violet" | "emerald" | "amber" | "rose";

const TONE_CLASSES: Record<StatTone, string> = {
  blue: "bg-gradient-to-br from-blue-500/25 to-blue-500/5 text-blue-300 ring-1 ring-inset ring-blue-400/25",
  violet: "bg-gradient-to-br from-violet-500/25 to-violet-500/5 text-violet-300 ring-1 ring-inset ring-violet-400/25",
  emerald: "bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 text-emerald-300 ring-1 ring-inset ring-emerald-400/25",
  amber: "bg-gradient-to-br from-amber-500/25 to-amber-500/5 text-amber-300 ring-1 ring-inset ring-amber-400/25",
  rose: "bg-gradient-to-br from-rose-500/25 to-rose-500/5 text-rose-300 ring-1 ring-inset ring-rose-400/25"
};

type SummaryStatCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  trend?: { direction: "up" | "down"; label: string };
};

export function SummaryStatCard({ title, value, suffix, hint, icon, tone, trend }: SummaryStatCardProps) {
  return (
    <ScrollReveal variant="fade-up" distance={10}>
      <Card className="ds-stat-card group h-full transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="ds-label">{title}</p>
            <p className="ds-stat-value">
              {value}
              {suffix || ""}
            </p>
            {trend ? (
              <p
                className={cn(
                  "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
                  trend.direction === "up" ? "text-emerald-400" : "text-rose-400"
                )}
              >
                {trend.direction === "up" ? "↑" : "↓"} {trend.label}
              </p>
            ) : hint ? (
              <p className="ds-caption mt-2">{hint}</p>
            ) : null}
          </div>
          {icon ? (
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
                tone ? TONE_CLASSES[tone] : "ds-stat-icon"
              )}
            >
              <AppIcon icon={icon} size="md" className={tone ? "!text-current" : undefined} />
            </span>
          ) : null}
        </div>
      </Card>
    </ScrollReveal>
  );
}
