"use client";

import { useMemo } from "react";
import { GraduationCap, CheckCircle2, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import {
  buildSkillLearningBundles,
  ALL_LEVELS,
  LEVEL_LABELS,
  type SkillLearningBundle,
} from "@/lib/skill-course-recommendations";
import { CourseCard } from "@/components/dashboard/course-card";
import { cn } from "@/lib/utils";

const cardBase =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/60";

const LEVEL_STYLES = {
  beginner:     { dot: "bg-emerald-400", label: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40" },
  intermediate: { dot: "bg-amber-400",   label: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40" },
  advanced:     { dot: "bg-rose-400",    label: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40" },
};

function LevelSection({ bundle, levelKey }: { bundle: SkillLearningBundle; levelKey: typeof ALL_LEVELS[number] }) {
  const courses = bundle.levels[levelKey];
  const styles = LEVEL_STYLES[levelKey];
  if (courses.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", styles.label)}>
          {LEVEL_LABELS[levelKey]}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard
            key={course.url}
            course={{ ...course, skill: bundle.displayName, free: true }}
            showSkillTag={false}
          />
        ))}
      </div>
    </div>
  );
}

type Props = {
  missingSkills: string[];
  targetRoleKey?: string;
  className?: string;
};

export function SkillLearningPathSection({ missingSkills, targetRoleKey, className }: Props) {
  const bundles = useMemo(
    () => buildSkillLearningBundles(missingSkills, targetRoleKey),
    [missingSkills, targetRoleKey]
  );

  if (!missingSkills.length) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center gap-2">
        <AppIcon icon={GraduationCap} size="sm" className="text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggested Learning Path</h3>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Free, verified courses per skill — structured from{" "}
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Beginner</span>
        {" → "}
        <span className="font-medium text-amber-600 dark:text-amber-400">Intermediate</span>
        {" → "}
        <span className="font-medium text-rose-600 dark:text-rose-400">Advanced</span>.
        Click <strong className="font-semibold text-slate-700 dark:text-slate-200">Open Course</strong> to go directly to the platform.
      </p>

      <div className="space-y-10">
        {bundles.map((bundle) => {
          const totalCourses = ALL_LEVELS.reduce((n, lvl) => n + bundle.levels[lvl].length, 0);
          const hasNoCourses = totalCourses === 0;

          return (
            <section key={bundle.skillKey} className="space-y-5">
              {/* Skill header */}
              <div className="flex flex-wrap items-center gap-2">
                <AppIcon icon={ChevronRight} size="xs" className="text-sky-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {bundle.displayName}
                </h4>
                {!hasNoCourses && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {totalCourses} course{totalCourses !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {hasNoCourses ? (
                <div className={cn(cardBase, "flex items-center gap-3 px-5 py-4")}>
                  <AppIcon icon={CheckCircle2} size="sm" className="shrink-0 text-slate-400" />
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    No courses available for this skill yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {ALL_LEVELS.map((lvl) => (
                    <LevelSection key={lvl} bundle={bundle} levelKey={lvl} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
