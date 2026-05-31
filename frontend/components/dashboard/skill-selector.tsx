"use client";

import { useEffect, useMemo, useState } from "react";
import { createCustomSkill, searchSkills, SkillOption } from "@/lib/intern-portal";

type SkillSelectorProps = {
  selected: string[];
  onChange: (skills: string[]) => void;
};

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

  function addSkill(name: string) {
    const normalized = String(name || "").trim();
    if (!normalized) return;
    if (lowerSelected.has(normalized.toLowerCase())) return;
    onChange([...selected, normalized]);
    setQuery("");
    setOptions([]);
  }

  async function addCustom() {
    const normalized = query.trim();
    if (!normalized) return;
    const created = await createCustomSkill(normalized);
    addSkill(created?.name || normalized);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="surface-input w-full px-3 py-2 text-sm"
          placeholder="Search and add skills"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="surface-btn-secondary rounded-lg px-3 py-2 text-xs font-semibold" onClick={addCustom}>
          Add
        </button>
      </div>
      {loading ? <p className="text-xs text-slate-500">Searching...</p> : null}
      {!loading && options.length > 0 ? (
        <div className="max-h-36 overflow-auto rounded-lg border border-slate-700 bg-slate-900">
          {options.map((option) => (
            <button
              key={option._id}
              type="button"
              className="block w-full border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              onClick={() => addSkill(option.name)}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {selected.map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-100">
            {skill}
            <button
              type="button"
              className="text-slate-400 hover:text-slate-200"
              onClick={() => onChange(selected.filter((entry) => entry.toLowerCase() !== skill.toLowerCase()))}
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
