"use client";

import { useState, useCallback, useEffect } from "react";
import { ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { isCourseSaved, toggleSavedCourse } from "@/lib/saved-courses";
import type { CourseRecommendation } from "@/lib/skill-course-recommendations";
import { cn } from "@/lib/utils";

const PROVIDER_ACCENT: Record<string, string> = {
  "Kaggle Learn":        "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  "freeCodeCamp":        "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  "NPTEL":               "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  "Microsoft Learn":     "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "Google Learn":        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "DeepLearning.AI":     "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  "Coursera":            "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  "MIT OpenCourseWare":  "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  "Harvard Online Learning": "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  "Cisco Skills For All":"bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
};

const LEVEL_DOT: Record<string, string> = {
  Beginner:     "bg-emerald-400",
  Intermediate: "bg-amber-400",
  Advanced:     "bg-rose-400",
};

type Props = {
  course: CourseRecommendation & { skill: string };
  showSkillTag?: boolean;
};

export function CourseCard({ course, showSkillTag = true }: Props) {
  const [saved, setSaved] = useState(false);

  // read from localStorage after mount
  useEffect(() => {
    setSaved(isCourseSaved(course.url));
  }, [course.url]);

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const next = toggleSavedCourse(course);
      setSaved(next);
    },
    [course]
  );

  const providerClass =
    PROVIDER_ACCENT[course.provider] ??
    "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300";

  const levelDot = LEVEL_DOT[course.level] ?? "bg-slate-400";

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Provider + free badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", providerClass)}>
            {course.provider}
          </span>
          {course.free && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              Free
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="mt-3 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
          {course.title}
        </h4>

        {/* Skill tag */}
        {showSkillTag && (
          <span className="mt-2 inline-block w-fit rounded-lg border border-slate-200/70 bg-slate-50/70 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            {course.skill}
          </span>
        )}

        {/* Description */}
        {course.description && (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
            {course.description}
          </p>
        )}

        {/* Level + duration */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <span className={cn("h-1.5 w-1.5 rounded-full", levelDot)} />
            {course.level}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {course.duration}
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        {/* Open Course — primary action */}
        <a
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-700 active:scale-[0.97] dark:bg-sky-500 dark:hover:bg-sky-600"
          onClick={(e) => e.stopPropagation()}
        >
          Open Course
          <AppIcon icon={ExternalLink} size="xs" className="opacity-80" />
        </a>

        {/* Save for later */}
        <button
          type="button"
          onClick={handleSave}
          aria-label={saved ? "Remove from saved" : "Save for later"}
          title={saved ? "Remove from saved" : "Save for later"}
          className={cn(
            "flex items-center justify-center rounded-xl border p-2 text-xs transition active:scale-[0.97]",
            saved
              ? "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-400"
              : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-sky-800 dark:hover:text-sky-400"
          )}
        >
          <AppIcon icon={saved ? BookmarkCheck : Bookmark} size="xs" />
        </button>
      </div>
    </article>
  );
}
