"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { clearAuthSession } from "@/lib/session";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Application, InternProfile, fetchInternApplications, fetchInternProfile } from "@/lib/intern-portal";

export default function InternApplicationsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProfile, loadedApps] = await Promise.all([fetchInternProfile(), fetchInternApplications(true)]);
        setProfile(loadedProfile);
        setApplications(loadedApps || []);
      } catch (err) {
        setError((err as Error).message || "Failed to load applications.");
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">Internships</p>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">My Applications</h2>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern")}>
              Back to Dashboard
            </Button>
          </div>

          {loading && <div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading applications...</div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

          {!loading && !error && applications.length === 0 && (
            <div className="surface-subtle p-4 text-sm text-slate-700 dark:text-slate-300">No applications found yet.</div>
          )}

          {!loading && !error && applications.length > 0 && (
            <div className="space-y-4">
              {applications.map((app) => (
                <SectionPanel
                  key={app._id}
                  title={app.internship?.role || "Internship"}
                  subtitle={`${app.internship?.company?.companyName || "Company"}${app.internship?.location ? ` - ${app.internship.location}` : ""}`}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Current Status</p>
                      <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{app.status}</p>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Skill Match at apply time: {app.matchScore || 0}%</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Applied Stages</p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                        {(app.stageHistory || []).length === 0 && <li>No stage updates yet.</li>}
                        {(app.stageHistory || []).map((stage, idx) => (
                          <li key={`${stage.stage}-${idx}`} className="surface-subtle px-2 py-1">
                            <span className="font-semibold capitalize">{stage.stage}</span>
                            {stage.note ? ` - ${stage.note}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </SectionPanel>
              ))}
            </div>
          )}
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
