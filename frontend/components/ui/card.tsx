import { cn } from "@/lib/utils";

type CardProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export function Card({ title, subtitle, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "surface-muted relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)] dark:hover:border-primary-500/40 dark:hover:shadow-[0_18px_38px_rgba(2,6,23,0.6)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-800/70" />
      {(title || subtitle) && (
        <div className="relative mb-4">
          {title && <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
