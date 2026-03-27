import { Card } from "@/components/ui/card";

type SummaryStatCardProps = {
  title: string;
  value: string | number;
  suffix?: string;
  hint?: string;
};

export function SummaryStatCard({ title, value, suffix, hint }: SummaryStatCardProps) {
  return (
    <Card className="border-none">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
        {suffix || ""}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}
