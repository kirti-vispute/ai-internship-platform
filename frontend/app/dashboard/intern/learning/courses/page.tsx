"use client";

import { useEffect, useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { LearningCoursesModule } from "@/components/dashboard/learning-courses-module";
import { InternProfile, fetchInternProfileWithScore } from "@/lib/intern-portal";

export default function LearningCoursesPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternProfileWithScore()
      .then((data) => setProfile(data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Learning"
            title="Courses"
            subtitle="Free, verified courses from Coursera, NPTEL, Kaggle, freeCodeCamp, Microsoft Learn, Google Learn, and more. Every link opens the real external platform."
          />

          {loading ? (
            <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              Loading courses…
            </div>
          ) : (
            <LearningCoursesModule profile={profile} />
          )}
    </div>
  );
}
