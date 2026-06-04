import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { EMPTY_STATE_ICONS } from "@/components/icons/empty-state-icons";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
  icon?: LucideIcon;
  presetKey?: keyof typeof EMPTY_STATE_ICONS;
};

export function EmptyState({
  title,
  hint,
  action,
  ctaLabel,
  ctaHref,
  className,
  icon,
  presetKey
}: EmptyStateProps) {
  const IconComponent = icon || (presetKey ? EMPTY_STATE_ICONS[presetKey] : Inbox);

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <AppIcon icon={IconComponent} size="lg" className="text-primary-600 dark:text-primary-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
      {!action && ctaLabel && ctaHref && (
        <div className="mt-4 flex justify-center">
          <Button href={ctaHref} size="sm" variant="secondary">
            {ctaLabel}
          </Button>
        </div>
      )}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">InternAI</p>
    </div>
  );
}

export function BrandedEmptyState({
  preset,
  presetKey,
  action,
  className
}: {
  preset: { title: string; hint: string; ctaLabel?: string; ctaHref?: string };
  presetKey?: keyof typeof EMPTY_STATE_ICONS;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <EmptyState
      title={preset.title}
      hint={preset.hint}
      ctaLabel={preset.ctaLabel}
      ctaHref={preset.ctaHref}
      action={action}
      className={className}
      presetKey={presetKey}
    />
  );
}
