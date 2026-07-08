"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

type InterviewerComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  fieldClassName?: string;
};

/**
 * Searchable, freeform interviewer picker. No interviewer directory exists in the
 * data model (no backend change permitted), so this is a create-or-pick combobox:
 * type any name, or pick from previously-used interviewer names for this company.
 */
export function InterviewerCombobox({
  value,
  onChange,
  suggestions = [],
  placeholder = "Search or type a name…",
  className,
  fieldClassName
}: InterviewerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    const pool = query ? suggestions.filter((name) => name.toLowerCase().includes(query)) : suggestions;
    return pool.slice(0, 6);
  }, [value, suggestions]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setHighlighted(0);
  }, [value, open]);

  function selectOption(name: string) {
    onChange(name);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || filtered.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prev) => (prev + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectOption(filtered[highlighted]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[highlighted] ? `${listboxId}-${highlighted}` : undefined}
          value={value}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100",
            fieldClassName
          )}
        />
      </div>
      {open && filtered.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {filtered.map((name, index) => (
            <li
              key={name}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === highlighted}
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(name);
              }}
              onMouseEnter={() => setHighlighted(index)}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200",
                index === highlighted && "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-200"
              )}
            >
              <UserRound className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              <span className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
