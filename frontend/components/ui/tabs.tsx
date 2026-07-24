"use client";

import { useRef } from "react";
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
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activateTab = (index: number) => {
    const item = items[index];
    if (!item) return;
    onChange(item.key);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    let next: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        next = index >= last ? 0 : index + 1;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        next = index <= 0 ? last : index - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    activateTab(next);
  };

  return (
    <div
      role="tablist"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto rounded-[var(--ds-radius)] border border-[var(--ds-border)] bg-[var(--ds-surface)] p-1",
        className
      )}
    >
      {items.map((item, index) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
                  isActive ? "bg-[var(--ds-accent)]/15 text-[var(--ds-accent)]" : "bg-[var(--ds-badge-bg)] text-[var(--ds-muted)]"
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
