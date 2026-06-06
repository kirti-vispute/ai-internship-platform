"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createCustomSkill, searchSkills, SkillOption } from "@/lib/intern-portal";

type SkillSelectorProps = {
  selected: string[];
  onChange: (skills: string[]) => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400";

const chipClass =
  "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export function SkillSelector({ selected, onChange }: SkillSelectorProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setOptions([]);
      return;
    }
    setLoading(true);
    searchSkills(query.trim())
      .then((items) => {
        if (active) setOptions(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const lowerSelected = useMemo(() => new Set(selected.map((item) => item.toLowerCase())), [selected]);

  const addSkill = useCallback(
    (name: string) => {
      const normalized = String(name || "").trim();
      if (!normalized) return;
      if (lowerSelected.has(normalized.toLowerCase())) return;
      onChange([...selected, normalized]);
      setQuery("");
      setOptions([]);
    },
    [lowerSelected, onChange, selected]
  );

  async function addCustom() {
    const normalized = query.trim();
    if (!normalized) return;
    const created = await createCustomSkill(normalized);
    addSkill(created?.name || normalized);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inputClass} placeholder="Search and add skills" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          onClick={addCustom}
        >
          Add
        </button>
      </div>
      {loading ? <p className="text-xs text-slate-500 dark:text-slate-400">Searching...</p> : null}
      {!loading && options.length > 0 ? (
        <div className="max-h-36 overflow-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          {options.map((option) => (
            <button
              key={option._id}
              type="button"
              className="block w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
              onClick={() => addSkill(option.name)}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {selected.map((skill) => (
          <span key={skill} className={chipClass}>
            {skill}
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              aria-label={`Remove ${skill}`}
              onClick={() => onChange(selected.filter((entry) => entry.toLowerCase() !== skill.toLowerCase()))}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
