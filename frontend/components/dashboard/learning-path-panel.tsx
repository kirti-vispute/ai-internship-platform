"use client";

import { useMemo } from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { learningPaths } from "@/data/dummy";
import { AppIcon } from "@/components/icons/app-icon";
import type { InternProfile } from "@/lib/intern-portal";

const CURATED_FALLBACK = learningPaths.slice(0, 4);

type Props = {
  profile: InternProfile | null;
};

export function LearningPathPanel({ profile }: Props) {
  const recommendations = useMemo(
    () => (profile?.resume?.analysis?.skillIntelligence?.learningRecommendations || []).slice(0, 3),
    [profile?.resume?.analysis?.skillIntelligence?.learningRecommendations]
  );

  const courses = CURATED_FALLBACK.slice(0, 4);

  if (!profile?.resumeUploaded) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
        <p className="text-sm text-slate-600 dark:text-slate-400">Upload your resume to see role-aligned learning picks.</p>
        <Link href="/dashboard/intern/resume" className="mt-3 inline-block text-sm font-semibold text-sky-700 dark:text-sky-400">
          Upload resume
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {recommendations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AppIcon icon={GraduationCap} size="sm" className="text-sky-600" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Suggested for your gaps</h3>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:divide-slate-800">
            {recommendations.map((item, idx) => (
              <p key={idx} className="px-5 py-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {item}
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Curated courses</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Top picks aligned to common internship roles — not a full catalog.</p>
        <div className="space-y-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
            >
              <p className="text-xs font-medium text-sky-700 dark:text-sky-400">{course.category}</p>
              <h4 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{course.title}</h4>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{course.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
