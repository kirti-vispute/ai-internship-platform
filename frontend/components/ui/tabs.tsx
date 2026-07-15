"use client";

import { cn } from "@/lib/utils";

export type TabItem = {
  key: string;
  label: string;
  count?: number;
};

type TabsProps = {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto rounded-[var(--ds-radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] p-1",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--ds-radius-sm)] px-3.5 py-2 text-sm font-semibold transition-colors duration-150",
              isActive ? "bg-[var(--ds-surface-raised)] text-[var(--ds-accent)] shadow-[inset_0_0_0_1px_var(--ds-border-strong)]" : "text-[var(--ds-muted)] hover:text-[var(--ds-text)]"
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold leading-none",
                  isActive ? "bg-[var(--ds-accent)]/15 text-[var(--ds-accent)]" : "bg-white/5 text-[var(--ds-muted)]"
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
