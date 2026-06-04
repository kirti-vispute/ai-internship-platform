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
    <ScrollReveal variant="soft-scale" distance={12}>
      <Card className="h-full border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
            <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {value}
              {suffix || ""}
            </p>
            {hint && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
          </div>
          {icon ? (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <AppIcon icon={icon} size="md" className="text-primary-600 dark:text-primary-400" />
            </span>
          ) : null}
        </div>
      </Card>
    </ScrollReveal>
  );
}
