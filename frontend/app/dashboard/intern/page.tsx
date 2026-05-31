"use client";

import { useEffect, useMemo, useState } from "react";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { SectionPanel } from "@/components/dashboard/section-panel";
import {
  Application,
  InternProfile,
  Recommendation,
  fetchInternApplications,
  fetchInternProfileWithScore,
  fetchInternRecommendations,
  peekInternProfile
} from "@/lib/intern-portal";

export default function InternDashboardOverviewPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(() => typeof window === "undefined" ? true : !peekInternProfile());
  const [error, setError] = useState<string | null>(null);

  const hasParsedResumeSkills = (profile?.resume?.parsed?.skills || []).length > 0;

  const summary = useMemo(() => {
    const resumeScore = profile?.resume?.score || 0;
    const openOpportunities = recommendations.length;
    const avgOverallRecommendation = recommendations.length
      ? Math.round(recommendations.reduce((sum, item) => sum + item.overallRecommendationScore, 0) / recommendations.length)
      : 0;
    return { resumeScore, openOpportunities, avgOverallRecommendation, applicationsCount: applications.length };
  }, [profile, recommendations, applications]);

  useEffect(() => {
    async function load() {
      try {
        if (!peekInternProfile()) setLoading(true);
        setError(null);

        const [loadedProfile, loadedApplications] = await Promise.all([
          fetchInternProfileWithScore(),
          fetchInternApplications()
        ]);
        setProfile(loadedProfile);
        setApplications(loadedApplications);

        const parsedSkills = loadedProfile?.resume?.parsed?.skills || [];
        if (loadedProfile.resumeUploaded && parsedSkills.length > 0) {
          const loadedRecommendations = await fetchInternRecommendations(parsedSkills, true);
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

  return (
    <>
      {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading overview...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryStatCard title="Resume Score" value={summary.resumeScore} suffix="/100" />
              <SummaryStatCard title="Open Opportunities" value={summary.openOpportunities} />
              <SummaryStatCard title="Avg Overall Score" value={summary.avgOverallRecommendation} suffix="%" />
              <SummaryStatCard title="Applications Count" value={summary.applicationsCount} />
            </section>

            <SectionPanel title="Overview Notes" subtitle="Recommendation scores are explainable and separated by factor.">
              {!profile?.resumeUploaded || !hasParsedResumeSkills ? (
                <div className="surface-subtle px-3 py-3 text-sm text-slate-700 dark:text-slate-300">
                  Upload your resume to get accurate AI internship recommendations.
                </div>
              ) : recommendations.length === 0 ? (
                <div className="surface-subtle px-3 py-3 text-sm text-slate-700 dark:text-slate-300">
                  No matching internships found right now. Update your skills or check back after new postings.
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li className="surface-subtle px-3 py-2">Required Skill Match % is computed from required skills only.</li>
                  <li className="surface-subtle px-3 py-2">Preferred Skill Match % is shown only when preferred skills exist.</li>
                  <li className="surface-subtle px-3 py-2">Overall Score = 80% required + 20% preferred (or required only when preferred is absent).</li>
                </ul>
              )}
            </SectionPanel>
          </div>
        )}
    </>
  );
}
