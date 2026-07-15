"use client";

/**
 * LearningCoursesModule — /dashboard/intern/learning/courses
 *
 * STRICT FILTERING:
 *   courses = CATALOG[selectedSkill]   ← exact key only, no cross-skill leakage
 *
 * No fuzzy matching, no includes(), no regex, no global search across all skills.
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { BookOpen, Bookmark, Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { CourseCard } from "@/components/dashboard/course-card";
import {
  ALL_SKILLS,
  ALL_PROVIDERS,
  ALL_LEVELS,
  LEVEL_LABELS,
  getSkillLevels,
  getAllCourses,
  type SkillLevels,
  type CourseRecommendation,
} from "@/lib/skill-course-recommendations";
import { getSavedCourses, type SavedCourse } from "@/lib/saved-courses";
import { cn } from "@/lib/utils";
import type { InternProfile } from "@/lib/intern-portal";

const LEVEL_STYLES = {
  beginner:     "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40",
  intermediate: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40",
  advanced:     "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40",
};

const ROLE_PRIORITY_SKILLS: Record<string, string[]> = {
  data_scientist:      ["Python", "SQL", "Statistics", "Machine Learning", "Data Science", "Data Analytics", "Deep Learning", "Artificial Intelligence"],
  frontend_developer:  ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Next.js", "UI/UX Design", "Tailwind CSS", "UI Development"],
  backend_developer:   ["Node.js", "Express.js", "SQL", "MongoDB", "REST APIs", "Authentication", "Docker", "PostgreSQL"],
  ai_ml_engineer:      ["Python", "Machine Learning", "Deep Learning", "Statistics", "NLP", "LLMs", "Generative AI", "Artificial Intelligence"],
  full_stack_developer:["JavaScript", "React", "Node.js", "MongoDB", "REST APIs", "SQL", "TypeScript", "Express.js", "Next.js"],
};

type Tab = "all" | "saved";
type AllCourse = CourseRecommendation & { skill: string; levelKey: typeof ALL_LEVELS[number]; free: true };

const inputBase =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500";

const selectBase =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-500";

type Props = { profile: InternProfile | null };

export function LearningCoursesModule({ profile }: Props) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [savedTick, setSavedTick] = useState(0);

  useEffect(() => { setSavedCourses(getSavedCourses()); }, [savedTick]);
  useEffect(() => {
    const handler = () => setSavedTick((k) => k + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  useEffect(() => { if (tab === "saved") setSavedTick((k) => k + 1); }, [tab]);
  const refreshSaved = useCallback(() => setSavedTick((k) => k + 1), []);

  const allCourses = useMemo<AllCourse[]>(() => getAllCourses() as AllCourse[], []);
  const roleKey = profile?.resume?.analysis?.skillIntelligence?.targetRoleKey as string | undefined;

  // Sort skills by role priority, then alphabetically
  const sortedSkills = useMemo(() => {
    const priority = roleKey ? (ROLE_PRIORITY_SKILLS[roleKey] || []) : [];
    return [...ALL_SKILLS].sort((a, b) => {
      const ia = priority.findIndex((s) => s === a);
      const ib = priority.findIndex((s) => s === b);
      const pa = ia === -1 ? 999 : ia;
      const pb = ib === -1 ? 999 : ib;
      return pa !== pb ? pa - pb : a.localeCompare(b);
    });
  }, [roleKey]);

  // ── STRICT skill filter ──────────────────────────────────────────────────
  // When a skill is selected, ONLY show courses from CATALOG[selectedSkill].
  // No cross-skill leakage, no includes(), no global search.
  const strictSkillLevels = useMemo<SkillLevels | null>(() => {
    if (filterSkill === "all") return null;
    return getSkillLevels(filterSkill); // exact key lookup
  }, [filterSkill]);

  // For "all skills" mode, use the flat list with optional provider/level/search filters
  const filteredFlat = useMemo<AllCourse[]>(() => {
    if (filterSkill !== "all") return [];           // handled by strictSkillLevels
    const q = query.trim().toLowerCase();
    return allCourses.filter((c) => {
      if (filterProvider !== "all" && c.provider !== filterProvider) return false;
      if (filterLevel !== "all" && c.levelKey !== filterLevel) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.skill.toLowerCase().includes(q) && !c.provider.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allCourses, filterSkill, filterProvider, filterLevel, query]);

  // For single-skill strict view, optionally filter by provider/level/search
  const strictFiltered = useMemo<SkillLevels | null>(() => {
    if (!strictSkillLevels) return null;
    const q = query.trim().toLowerCase();
    function applyFilters(courses: CourseRecommendation[]) {
      return courses.filter((c) => {
        if (filterProvider !== "all" && c.provider !== filterProvider) return false;
        if (q && !c.title.toLowerCase().includes(q) && !c.provider.toLowerCase().includes(q)) return false;
        return true;
      });
    }
    // Level filter — if a level is selected, zero out others
    return {
      beginner:     (filterLevel === "all" || filterLevel === "beginner")     ? applyFilters(strictSkillLevels.beginner)     : [],
      intermediate: (filterLevel === "all" || filterLevel === "intermediate") ? applyFilters(strictSkillLevels.intermediate) : [],
      advanced:     (filterLevel === "all" || filterLevel === "advanced")     ? applyFilters(strictSkillLevels.advanced)      : [],
    };
  }, [strictSkillLevels, filterProvider, filterLevel, query]);

  const filteredSaved = useMemo(() => {
    const q = query.trim().toLowerCase();
    return savedCourses.filter((c) => {
      if (filterSkill !== "all" && c.skill !== filterSkill) return false;
      if (filterProvider !== "all" && c.provider !== filterProvider) return false;
      if (filterLevel !== "all" && (c.level?.toLowerCase() !== filterLevel)) return false;
      if (q && !c.title.toLowerCase().includes(q) && !c.skill.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [savedCourses, filterSkill, filterProvider, filterLevel, query]);

  // Group flat list by skill (for "All" view with no skill selected)
  const groupedBySkill = useMemo(() => {
    const map = new Map<string, AllCourse[]>();
    for (const c of filteredFlat) {
      if (!map.has(c.skill)) map.set(c.skill, []);
      map.get(c.skill)!.push(c);
    }
    // Preserve role-priority sort order
    return sortedSkills.filter((s) => map.has(s)).map((s) => [s, map.get(s)!] as [string, AllCourse[]]);
  }, [filteredFlat, sortedSkills]);

  function clearFilters() {
    setQuery("");
    setFilterSkill("all");
    setFilterProvider("all");
    setFilterLevel("all");
  }

  const hasFilters = filterSkill !== "all" || filterProvider !== "all" || filterLevel !== "all" || query;
  const totalAll = allCourses.length;

  return (
    <div className="space-y-6" onClick={refreshSaved}>
      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50/60 p-1 w-fit dark:border-slate-800 dark:bg-slate-900/40">
        {(["all", "saved"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition",
              tab === t
                ? "bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <AppIcon icon={t === "all" ? BookOpen : Bookmark} size="xs" />
            {t === "all" ? "All Courses" : "Saved"}
            {t === "all" && (
              <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold dark:bg-slate-700">
                {totalAll}
              </span>
            )}
            {t === "saved" && savedCourses.length > 0 && (
              <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {savedCourses.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Search + Filters ── */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <AppIcon icon={Search} size="xs" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, skill, or provider…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(inputBase, "pl-9")}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <AppIcon icon={X} size="xs" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition",
              filtersOpen || hasFilters
                ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            )}
          >
            <AppIcon icon={SlidersHorizontal} size="xs" />
            Filters
          </button>
        </div>

        {filtersOpen && (
          <div className="grid gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-4 sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900/40">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Skill</label>
              <select value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className={selectBase}>
                <option value="all">All Skills</option>
                {sortedSkills.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Provider</label>
              <select value={filterProvider} onChange={(e) => setFilterProvider(e.target.value)} className={selectBase}>
                <option value="all">All Providers</option>
                {ALL_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Level</label>
              <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className={selectBase}>
                <option value="all">All Levels</option>
                {ALL_LEVELS.map((l) => <option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
              </select>
            </div>
          </div>
        )}

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400">
            <AppIcon icon={X} size="xs" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {tab === "saved" ? (
        /* SAVED TAB */
        savedCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <AppIcon icon={Bookmark} size="md" className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">No saved courses yet.</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click the bookmark icon on any course to save it here.</p>
          </div>
        ) : filteredSaved.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No saved courses match your filters.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSaved.map((c) => <CourseCard key={c.url} course={c} />)}
          </div>
        )
      ) : filterSkill !== "all" ? (
        /* STRICT SINGLE-SKILL VIEW */
        !strictSkillLevels ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-sm text-slate-600 dark:text-slate-300">No courses available for this skill yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {ALL_LEVELS.map((lvl) => {
              const courses = strictFiltered?.[lvl] ?? [];
              if (courses.length === 0) return null;
              return (
                <section key={lvl} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", LEVEL_STYLES[lvl])}>
                      {LEVEL_LABELS[lvl]}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {courses.map((c) => (
                      <CourseCard key={c.url} course={{ ...c, skill: filterSkill, free: true }} showSkillTag={false} />
                    ))}
                  </div>
                </section>
              );
            })}
            {ALL_LEVELS.every((l) => (strictFiltered?.[l] ?? []).length === 0) && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No courses match your filters for this skill.</p>
            )}
          </div>
        )
      ) : (
        /* ALL SKILLS VIEW — grouped by skill, then by level */
        groupedBySkill.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No courses match your search or filters.</p>
        ) : (
          <div className="space-y-12">
            {groupedBySkill.map(([skill, courses]) => {
              // Within each skill group, further group by level
              const byLevel: Record<string, AllCourse[]> = { beginner: [], intermediate: [], advanced: [] };
              for (const c of courses) byLevel[c.levelKey]?.push(c);
              return (
                <section key={skill} className="space-y-5">
                  <div className="flex items-center gap-2">
                    <AppIcon icon={ChevronRight} size="xs" className="text-sky-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{skill}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {courses.length}
                    </span>
                  </div>
                  <div className="space-y-5">
                    {ALL_LEVELS.map((lvl) => {
                      const lc = byLevel[lvl];
                      if (!lc?.length) return null;
                      return (
                        <div key={lvl} className="space-y-3">
                          <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold", LEVEL_STYLES[lvl])}>
                            {LEVEL_LABELS[lvl]}
                          </span>
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {lc.map((c) => <CourseCard key={c.url} course={c} showSkillTag={false} />)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
