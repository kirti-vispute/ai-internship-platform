"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

export type DashboardTabItem = {
  key: string;
  label: string;
  icon?: LucideIcon;
  content: React.ReactNode;
};

type DashboardTabsProps = {
  tabs: DashboardTabItem[];
  defaultKey?: string;
};

export function DashboardTabs({ tabs, defaultKey }: DashboardTabsProps) {
  const [activeKey, setActiveKey] = useState(defaultKey ?? tabs[0]?.key);
  const activeTab = tabs.find((tab) => tab.key === activeKey) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Dashboard sections"
        className="flex flex-wrap gap-1.5 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-1.5"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab?.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveKey(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                isActive
                  ? "bg-[var(--ds-surface)] text-[var(--ds-text)] shadow-sm"
                  : "text-[var(--ds-muted)] hover:text-[var(--ds-text)]"
              )}
            >
              {tab.icon ? <AppIcon icon={tab.icon} size="sm" /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="space-y-6">
        {activeTab?.content}
      </div>
    </div>
  );
}
