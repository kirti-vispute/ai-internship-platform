"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { clearAuthSession } from "@/lib/session";
import { InternProfile, fetchInternProfileWithScore } from "@/lib/intern-portal";

function cleanImprovementText(value: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[^A-Za-z0-9]+/, "")
    .trim();
}

export default function InternResumeScorePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setProfile(await fetchInternProfileWithScore());
      } catch (err) {
        setError((err as Error).message || "Failed to load resume score.");
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

  const analysis = profile?.resume?.analysis;

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading resume score...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <SummaryStatCard title="Resume Score" value={profile?.resume?.score || 0} suffix="/100" />
              <SummaryStatCard title="Score Source" value={profile?.resume?.scoreSource || "fallback"} />
              <SummaryStatCard title="Predicted Category" value={profile?.resume?.predictedCategory || "N/A"} />
            </section>

            <SectionPanel title="Resume Analysis" subtitle="Section breakdown and improvement guidance.">
              {!profile?.resumeUploaded ? (
                <p className="text-sm text-slate-600">Upload a resume to view score analysis.</p>
              ) : !analysis ? (
                <p className="text-sm text-slate-600">Analysis unavailable.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {(analysis.sectionBreakdown || []).map((section) => (
                      <div key={section.key}>
                        <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                          <span>{section.label}</span>
                          <span className="font-semibold text-slate-800">{section.score}/100</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100">
                          <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-blue-500" style={{ width: `${Math.max(6, section.score)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Top Improvements</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-slate-700">
                      {(analysis.improvements || []).slice(0, 5).map((item, idx) => (
                        <li key={`improve-${idx}`}>{cleanImprovementText(item)}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}



