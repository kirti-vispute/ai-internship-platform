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
        "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-glow",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-slate-50/80 to-transparent" />
      {(title || subtitle) && (
        <div className="relative mb-4">
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
