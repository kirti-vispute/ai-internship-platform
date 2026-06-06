"use client";

/**
 * LearningPathPanel — sidebar panel used in the intern dashboard home.
 * Redirects user to the full Courses page (rebuilt with verified external links).
 */
import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import type { InternProfile } from "@/lib/intern-portal";

type Props = {
  profile: InternProfile | null;
};

export function LearningPathPanel({ profile }: Props) {
  const missingSkills: string[] =
    profile?.resume?.analysis?.skillIntelligence?.skillGaps?.slice(0, 3) || [];

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center gap-2">
        <AppIcon icon={GraduationCap} size="sm" className="text-sky-600 dark:text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Learning Path</h3>
      </div>

      {missingSkills.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">Top skills to address:</p>
          <ul className="space-y-1">
            {missingSkills.map((skill) => (
              <li key={skill} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span className="capitalize">{skill}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {profile?.resumeUploaded
            ? "No major skill gaps detected."
            : "Upload your resume to see recommended courses."}
        </p>
      )}

      <Link
        href="/dashboard/intern/learning/courses"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
      >
        View all courses
        <AppIcon icon={ArrowRight} size="xs" />
      </Link>
    </div>
  );
}
