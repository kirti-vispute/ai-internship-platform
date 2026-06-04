"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { LearningPathPanel } from "@/components/dashboard/learning-path-panel";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfileWithScore } from "@/lib/intern-portal";

export default function LearningCoursesPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternProfileWithScore(true)
      .then((data) => setProfile(data))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack max-w-3xl">
          <DashboardPageHeader
            eyebrow="Student layer"
            title="Learning path"
            subtitle="Role-aligned picks from your skill analysis — not a full course catalog."
          />
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
              Loading recommendations…
            </div>
          ) : (
            <LearningPathPanel profile={profile} />
          )}
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
