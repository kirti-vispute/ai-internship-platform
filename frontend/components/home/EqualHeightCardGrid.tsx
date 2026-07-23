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
  cyan: "bg-[var(--ds-chart-1)]/85",
  blue: "bg-[var(--ds-chart-2)]/85",
  indigo: "bg-[var(--ds-chart-3)]/85",
  emerald: "bg-[var(--ds-chart-4)]/85"
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
      ? "border-[var(--ds-border)] bg-[var(--ds-glass)] shadow-[0_12px_28px_rgba(2,6,23,0.28)] hover:border-[var(--ds-primary)]/55 hover:bg-[var(--ds-surface-hover)] hover:ring-1 hover:ring-[var(--ds-primary)]/35 hover:shadow-[0_22px_42px_rgba(2,6,23,0.5)]"
      : "border-[var(--ds-border)] bg-gradient-to-b from-[var(--ds-card)] to-[var(--ds-surface)] shadow-[0_14px_34px_rgba(15,23,42,0.12)] hover:border-[var(--ds-primary)]/65 hover:ring-1 hover:ring-[var(--ds-primary)]/35 hover:shadow-[0_26px_46px_rgba(15,23,42,0.24)]";

  return (
    <div className={cn("grid auto-rows-fr items-stretch gap-4 md:grid-cols-3", gridClassName, className)}>
      {items.map((item) => (
        <article
          key={item.title}
          data-cursor="card"
          className={cn(
            "homepage-card tilt-3d flex h-full flex-col rounded-2xl border p-5",
            minHeightClassName || "min-h-[198px]",
            cardToneClass,
            cardClassName
          )}
        >
          <div className="mb-3 flex items-center justify-end">
            <span className={cn("h-2.5 w-2.5 rounded-full", accentStyles[item.accent || "blue"])} />
          </div>
          <h3 className={cn("text-lg font-bold leading-tight text-[var(--ds-text)]", titleClassName)}>{item.title}</h3>
          <p className={cn("mt-3 flex-1 text-sm leading-6 text-[var(--ds-text-secondary)]", descriptionClassName)}>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
