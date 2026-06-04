import type { LucideIcon } from "lucide-react";
import { TiltCard } from "@/components/dashboard/TiltCard";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  titleIcon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, subtitle, titleIcon, className, children }: CardProps) {
  return (
    <TiltCard className={cn("surface-muted p-4 hover:border-slate-300 dark:hover:border-primary-500/50", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-800/70" />
      {(title || subtitle) && (
        <div className="relative mb-3">
          {title && (
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
              {titleIcon ? <AppIcon icon={titleIcon} size="sm" className="text-primary-600 dark:text-primary-400" /> : null}
              <span>{title}</span>
            </h3>
          )}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="relative min-w-0">{children}</div>
    </TiltCard>
  );
}



