"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { ResumeIntelligenceDashboard } from "@/components/dashboard/resume-intelligence-dashboard";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfileWithScore } from "@/lib/intern-portal";
import { FEATURE_FLAGS } from "@/constants/featureFlags";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { apiRequest } from "@/lib/api-client";

export default function InternSkillGapPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (targetRole?: string) => {
    try {
      setError(null);
      if (targetRole) {
        setLoadingRole(true);
        const scoreResp = await apiRequest<{
          score: number;
          analysis?: InternProfile["resume"]["analysis"];
        }>(`/api/intern/resume/score?targetRole=${encodeURIComponent(targetRole)}`);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                resume: {
                  ...prev.resume,
                  score: scoreResp.score,
                  analysis: scoreResp.analysis || prev.resume.analysis
                }
              }
            : prev
        );
      } else {
        setLoading(true);
        setProfile(await fetchInternProfileWithScore(true));
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load skill analysis.");
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading skill intelligence…</div>
        ) : (
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            {!FEATURE_FLAGS.ENABLE_AI ? (
              <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">AI features are currently disabled.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <ReportDownloadButton reportKey="skill-gap" label="Download Skill Gap PDF" disabled={!profile?.resumeUploaded} />
                </div>

                <ResumeIntelligenceDashboard
                  profile={profile}
                  analysis={profile?.resume?.analysis}
                  loadingRole={loadingRole}
                  onTargetRoleChange={(roleKey) => loadProfile(roleKey)}
                />
              </>
            )}
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
