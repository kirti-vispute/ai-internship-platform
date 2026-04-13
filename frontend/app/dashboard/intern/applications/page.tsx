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
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="surface-subtle px-3 py-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Current Status</p>
                      <p className="mt-1 inline-flex rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold capitalize text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{app.status.replace(/_/g, " ")}</p>
                    </div>
                    <div className="surface-subtle px-3 py-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Applied On</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</p>
                    </div>
                    <div className="surface-subtle px-3 py-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Relevance Score</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{app.relevanceScore ?? app.matchScore ?? 0}%</p>
                    </div>
                    <div className="surface-subtle px-3 py-2.5">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Work Mode / Location</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{app.internship?.location || "Not specified"}</p>
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
