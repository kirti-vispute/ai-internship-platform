"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { Application, InternProfile, fetchInternApplications, fetchInternProfile } from "@/lib/intern-portal";

export default function TrackProgressPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProfile, loadedApplications] = await Promise.all([fetchInternProfile(), fetchInternApplications()]);
        setProfile(loadedProfile);
        setApplications(loadedApplications);
      } catch (err) {
        setError((err as Error).message || "Failed to load progress.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const grouped = useMemo(() => {
    return applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
  }, [applications]);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading progress...</div>
        ) : (
          <div className="space-y-5">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

            <SectionPanel title="Application Status Summary" subtitle="Your live status distribution from backend.">
              {Object.keys(grouped).length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No progress data available yet.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(grouped).map(([status, count]) => (
                    <div key={status} className="surface-subtle p-3 text-sm">
                      <p className="font-semibold capitalize text-slate-900 dark:text-slate-100">{status}</p>
                      <p className="text-slate-600 dark:text-slate-300">{count}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Progress Timeline" subtitle="Stage history for each application.">
              {applications.length === 0 ? (
                <div className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">No applications found.</div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app._id} className="surface-subtle p-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {app.internship?.role || "Internship"} - <span className="capitalize">{app.status}</span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {(app.stageHistory || []).length === 0 && <li>No stage timeline yet.</li>}
                        {(app.stageHistory || []).map((stage, idx) => (
                          <li key={`${app._id}-${idx}`} className="surface-subtle px-2 py-1">
                            <span className="font-semibold capitalize">{stage.stage}</span>
                            {stage.note ? ` - ${stage.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
