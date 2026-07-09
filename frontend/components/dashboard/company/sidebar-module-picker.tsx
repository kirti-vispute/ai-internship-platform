"use client";

import { useMemo, useState } from "react";
import { SIDEBAR_MODULE_REGISTRY, SIDEBAR_MODULE_DESCRIPTIONS, type SidebarModuleKey } from "@/lib/company-portal";
import { cn } from "@/lib/utils";

type SidebarModulePickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
};

const GROUP_ORDER = ["Dashboard", "Recruitment", "Interviews", "Messaging", "Analytics", "Company", "Team", "Settings"];

export function SidebarModulePicker({ value, onChange, className }: SidebarModulePickerProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byGroup = new Map<string, typeof SIDEBAR_MODULE_REGISTRY>();
    for (const entry of SIDEBAR_MODULE_REGISTRY) {
      if (query && !entry.label.toLowerCase().includes(query)) continue;
      const list = byGroup.get(entry.group) || [];
      list.push(entry);
      byGroup.set(entry.group, list);
    }
    return GROUP_ORDER.map((group) => ({ group, entries: byGroup.get(group) || [] })).filter((g) => g.entries.length > 0);
  }, [search]);

  const selectableKeys = useMemo(
    () => SIDEBAR_MODULE_REGISTRY.filter((entry) => !entry.executiveOnly).map((entry) => entry.key),
    []
  );

  const enabledCount = value.filter((key) => selectableKeys.includes(key as SidebarModuleKey)).length;

  function toggle(key: string) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  }

  function selectAll() {
    onChange([...new Set([...value, ...selectableKeys])]);
  }

  function clearAll() {
    onChange(value.filter((key) => !selectableKeys.includes(key as SidebarModuleKey)));
  }

  function toggleAll() {
    const allSelected = selectableKeys.every((key) => value.includes(key));
    onChange(allSelected ? value.filter((key) => !selectableKeys.includes(key as SidebarModuleKey)) : [...new Set([...value, ...selectableKeys])]);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions..."
          className="surface-subtle w-full max-w-xs px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/60"
        />
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {enabledCount} of {selectableKeys.length} enabled
          </span>
          <button type="button" onClick={selectAll} className="font-semibold text-primary-700 hover:underline dark:text-primary-300">
            Select All
          </button>
          <button type="button" onClick={clearAll} className="font-semibold text-slate-600 hover:underline dark:text-slate-300">
            Clear All
          </button>
          <button type="button" onClick={toggleAll} className="font-semibold text-slate-600 hover:underline dark:text-slate-300">
            Toggle All
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map(({ group, entries }) => (
          <div key={group} className="surface-subtle space-y-2 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{group}</p>
            <div className="space-y-1.5">
              {entries.map((entry) => {
                const checked = value.includes(entry.key);
                const disabled = Boolean(entry.executiveOnly);
                return (
                  <label
                    key={entry.key}
                    title={SIDEBAR_MODULE_DESCRIPTIONS[entry.key]}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm",
                      disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(entry.key)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600"
                    />
                    <span className="text-slate-700 dark:text-slate-200">{entry.label}</span>
                    {disabled && <span className="text-[10px] uppercase tracking-wide text-slate-400">CEO only</span>}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
