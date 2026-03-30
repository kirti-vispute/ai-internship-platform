"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { Application, fetchInternApplications } from "@/lib/intern-portal";

export default function TrackProgressPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setApplications(await fetchInternApplications());
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
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading progress...</div>
        ) : (
          <div className="space-y-6">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <SectionPanel title="Application Status Summary" subtitle="Your live status distribution from backend.">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-slate-600">No progress data available yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(grouped).map(([status, count]) => (
                    <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold capitalize text-slate-900">{status}</p>
                      <p className="text-slate-600">{count}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>

            <SectionPanel title="Progress Timeline" subtitle="Stage history for each application.">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-600">No applications found.</p>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {app.internship?.role || "Internship"} • <span className="capitalize">{app.status}</span>
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-slate-700">
                        {(app.stageHistory || []).length === 0 && <li>No stage timeline yet.</li>}
                        {(app.stageHistory || []).map((stage, idx) => (
                          <li key={`${app._id}-${idx}`} className="rounded bg-white px-2 py-1">
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

