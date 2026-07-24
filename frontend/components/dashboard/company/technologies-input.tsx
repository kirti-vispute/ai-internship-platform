"use client";

import { useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { COMPANY_TECHNOLOGY_SUGGESTIONS } from "@/lib/company-portal";
import { cn } from "@/lib/utils";

type TechnologiesInputProps = {
  value: string[];
  onChange: (next: string[]) => void;
  error?: string | null;
  disabled?: boolean;
};

export function TechnologiesInput({ value, onChange, error, disabled }: TechnologiesInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedKeys = useMemo(() => new Set(value.map((t) => t.toLowerCase())), [value]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPANY_TECHNOLOGY_SUGGESTIONS.filter((tech) => !selectedKeys.has(tech.toLowerCase())).filter((tech) =>
      q ? tech.toLowerCase().includes(q) : true
    ).slice(0, 8);
  }, [query, selectedKeys]);

  function addTechnology(raw: string) {
    const tech = raw.trim();
    if (!tech) return;
    if (selectedKeys.has(tech.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...value, tech]);
    setQuery("");
  }

  function removeTechnology(tech: string) {
    onChange(value.filter((t) => t.toLowerCase() !== tech.toLowerCase()));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTechnology(query);
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeTechnology(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "ds-input flex min-h-[2.75rem] flex-wrap items-center gap-1.5 !h-auto py-1.5",
          error ? "border-[var(--ds-danger)]" : ""
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tech) => (
          <span
            key={tech}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] py-1 pl-2.5 pr-1.5 text-xs font-semibold text-[var(--ds-accent)]"
          >
            {tech}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTechnology(tech);
                }}
                className="rounded-full p-0.5 text-current transition-colors hover:bg-[var(--ds-border)]"
                aria-label={`Remove ${tech}`}
              >
                <AppIcon icon={X} size="xs" className="text-current" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder={value.length === 0 ? "Search or add a technology..." : "Add another..."}
          className="min-w-[8rem] flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--ds-muted)]"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="relative">
          <div className="ds-card absolute z-20 mt-1 w-full max-h-56 overflow-y-auto !p-1.5">
            {suggestions.map((tech) => (
              <button
                key={tech}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTechnology(tech)}
                className="block w-full rounded-[var(--ds-radius-sm)] px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-[var(--ds-surface-raised)]"
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      )}

      {error ? <p className="text-xs font-medium text-[var(--ds-danger)]">{error}</p> : null}
    </div>
  );
}
