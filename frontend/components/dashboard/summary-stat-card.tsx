import { Card } from "@/components/ui/card";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

type SummaryStatCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  hint?: string;
};

export function SummaryStatCard({ title, value, suffix, hint }: SummaryStatCardProps) {
  return (
    <ScrollReveal variant="soft-scale" distance={12}>
      <Card className="border-none bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          {value}
          {suffix || ""}
        </p>
        {hint && <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      </Card>
    </ScrollReveal>
  );
}
