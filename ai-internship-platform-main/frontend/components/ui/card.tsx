import { TiltCard } from "@/components/dashboard/TiltCard";
import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <TiltCard className={cn("surface-muted p-4 hover:border-slate-300 dark:hover:border-primary-500/50", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-800/70" />
      {(title || subtitle) && (
        <div className="relative mb-3">
          {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="relative">{children}</div>
    </TiltCard>
  );
}



