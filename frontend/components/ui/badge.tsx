import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-[var(--ds-border)] bg-[var(--ds-surface-raised)] text-[var(--ds-muted)]",
  accent: "border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] text-[var(--ds-accent)]",
  success: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  info: "border-sky-400/25 bg-sky-400/10 text-sky-300"
};

type BadgeProps = {
  tone?: BadgeTone;
  icon?: LucideIcon;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ tone = "neutral", icon, dot, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-current")} /> : null}
      {icon ? <AppIcon icon={icon} size="xs" className="text-current" /> : null}
      {children}
    </span>
  );
}
