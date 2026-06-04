import { cn } from "@/lib/utils";
import { BRAND_NAME } from "@/lib/brand";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function DashboardPageHeader({ eyebrow, title, subtitle, actions, className }: DashboardPageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300">
            {eyebrow} · {BRAND_NAME}
          </p>
        )}
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
