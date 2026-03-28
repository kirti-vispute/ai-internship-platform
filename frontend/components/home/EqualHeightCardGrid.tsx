import { cn } from "@/lib/utils";

export type GridItem = {
  title: string;
  description: string;
  accent?: "cyan" | "blue" | "indigo" | "emerald";
};

type EqualHeightCardGridProps = {
  items: GridItem[];
  className?: string;
  gridClassName?: string;
  cardClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  minHeightClassName?: string;
  tone?: "light" | "dark";
};

const accentStyles: Record<NonNullable<GridItem["accent"]>, string> = {
  cyan: "bg-cyan-500/85",
  blue: "bg-blue-500/85",
  indigo: "bg-indigo-500/85",
  emerald: "bg-emerald-500/85"
};

export function EqualHeightCardGrid({
  items,
  className,
  gridClassName,
  cardClassName,
  titleClassName,
  descriptionClassName,
  minHeightClassName,
  tone = "light"
}: EqualHeightCardGridProps) {
  const cardToneClass =
    tone === "dark"
      ? "border-white/15 bg-white/5 shadow-[0_12px_28px_rgba(2,6,23,0.28)] hover:border-cyan-300/55 hover:bg-white/10 hover:ring-1 hover:ring-cyan-300/35 hover:shadow-[0_22px_42px_rgba(2,6,23,0.5)]"
      : "border-slate-200/80 bg-gradient-to-b from-white to-slate-50 shadow-[0_14px_34px_rgba(15,23,42,0.12)] hover:border-cyan-300/65 hover:ring-1 hover:ring-cyan-300/35 hover:shadow-[0_26px_46px_rgba(15,23,42,0.24)] dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/80 dark:shadow-[0_16px_34px_rgba(2,6,23,0.55)] dark:hover:border-cyan-400/55 dark:hover:ring-cyan-400/30 dark:hover:shadow-[0_26px_48px_rgba(2,6,23,0.7)]";

  return (
    <div className={cn("grid auto-rows-fr items-stretch gap-4 md:grid-cols-3", gridClassName, className)}>
      {items.map((item) => (
        <article
          key={item.title}
          data-cursor="card"
          className={cn(
            "tilt-3d flex h-full flex-col rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 hover:scale-[1.02]",
            minHeightClassName || "min-h-[198px]",
            cardToneClass,
            cardClassName
          )}
        >
          <div className="mb-3 flex items-center justify-end">
            <span className={cn("h-2.5 w-2.5 rounded-full", accentStyles[item.accent || "blue"])} />
          </div>
          <h3 className={cn("text-lg font-bold leading-tight text-slate-900 dark:text-slate-100", titleClassName)}>{item.title}</h3>
          <p className={cn("mt-3 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-300", descriptionClassName)}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
