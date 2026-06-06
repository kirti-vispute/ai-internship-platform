"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ResumeIntelligenceDashboard } from "@/components/dashboard/resume-intelligence-dashboard";
import { InternProfile, fetchInternProfileWithScore, peekInternProfile } from "@/lib/intern-portal";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { apiRequest } from "@/lib/api-client";

export default function InternResumeScorePage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cached = peekInternProfile();
    if (cached) {
      setProfile(cached);
      setLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (targetRole?: string) => {
    try {
      setError(null);
      if (targetRole) {
        setLoadingRole(true);
        const scoreResp = await apiRequest<{
          score: number;
          analysis?: InternProfile["resume"]["analysis"];
          scoreSource?: string;
        }>(`/api/intern/resume/score?targetRole=${encodeURIComponent(targetRole)}`);
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                resume: {
                  ...prev.resume,
                  score: scoreResp.score,
                  scoreSource: scoreResp.scoreSource,
                  analysis: scoreResp.analysis || prev.resume.analysis
                }
              }
            : prev
        );
      } else {
        setProfile(await fetchInternProfileWithScore());
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load resume intelligence.");
    } finally {
      setLoading(false);
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <>
      {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-600 dark:text-slate-300">Loading resume intelligence…</div>
        ) : (
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              <ReportDownloadButton reportKey="resume-analysis" label="Download Resume Analysis PDF" disabled={!profile?.resumeUploaded} />
            </div>

            <ResumeIntelligenceDashboard
              profile={profile}
              analysis={profile?.resume?.analysis}
              loadingRole={loadingRole}
              onTargetRoleChange={(roleKey) => loadProfile(roleKey)}
            />
          </div>
      )}
    </>
  );
}
