import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { EMPTY_STATE_ICONS } from "@/components/icons/empty-state-icons";
import { BRAND_NAME } from "@/lib/brand";
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
    <div className={cn("ds-card border-dashed px-6 py-10 text-center", className)}>
      <div className="ds-stat-icon mx-auto mb-4">
        <AppIcon icon={IconComponent} size="lg" />
      </div>
      <p className="ds-h3">{title}</p>
      {hint && <p className="ds-caption mt-1">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
      {!action && ctaLabel && ctaHref && (
        <div className="mt-4 flex justify-center">
          <Button href={ctaHref} size="sm" variant="secondary">
            {ctaLabel}
          </Button>
        </div>
      )}
      <p className="ds-label mt-4">{BRAND_NAME}</p>
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
