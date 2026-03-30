"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import {
  Application,
  InternProfile,
  Recommendation,
  fetchInternApplications,
  fetchInternProfileWithScore,
  fetchInternRecommendations
} from "@/lib/intern-portal";

export default function InternDashboardOverviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const resumeScore = profile?.resume?.score || 0;
    const openOpportunities = recommendations.length;
    const avgMatchScore = recommendations.length
      ? Math.round(recommendations.reduce((sum, item) => sum + item.recommendationScore, 0) / recommendations.length)
      : 0;
    return { resumeScore, openOpportunities, avgMatchScore, applicationsCount: applications.length };
  }, [profile, recommendations, applications]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const loadedProfile = await fetchInternProfileWithScore();
        setProfile(loadedProfile);

        const loadedApplications = await fetchInternApplications();
        setApplications(loadedApplications);

        if (loadedProfile.resumeUploaded) {
          const loadedRecommendations = await fetchInternRecommendations();
          setRecommendations(loadedRecommendations);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        setError((err as Error).message || "Failed to load dashboard overview.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading overview...</div>
        ) : (
          <div className="space-y-7">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStatCard title="Resume Score" value={summary.resumeScore} suffix="/100" />
              <SummaryStatCard title="Open Opportunities" value={summary.openOpportunities} />
              <SummaryStatCard title="Avg Match Score" value={summary.avgMatchScore} suffix="%" />
              <SummaryStatCard title="Applications Count" value={summary.applicationsCount} />
            </section>

            <SectionPanel title="Overview Notes" subtitle="Use the sidebar to navigate focused views.">
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="surface-subtle px-3 py-2 text-slate-700 dark:text-slate-300">Profile details and resume management are in My Profile.</li>
                <li className="surface-subtle px-3 py-2 text-slate-700 dark:text-slate-300">Internship discovery and tracking are in Internships.</li>
                <li className="surface-subtle px-3 py-2 text-slate-700 dark:text-slate-300">Learning resources and mock tests are in Learning.</li>
              </ul>
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}

