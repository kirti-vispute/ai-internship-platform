"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { Application, InternProfile, fetchInternApplications, fetchInternProfile } from "@/lib/intern-portal";

const TIMELINE_STEPS = ["applied", "reviewed", "shortlisted", "interview_scheduled", "interview_completed", "selected", "rejected"] as const;

function normalizeStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "screening") return "reviewed";
  if (value === "interview") return "interview_scheduled";
  if (value === "offered") return "selected";
  return value;
}

function getActiveTimelineStatus(application: Application) {
  const normalized = normalizeStatus(application.status);
  if (normalized === "rejected") return "rejected";
  if (TIMELINE_STEPS.includes(normalized as (typeof TIMELINE_STEPS)[number])) return normalized;
  return "applied";
}

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
                  {applications.map((app) => {
                    const activeStatus = getActiveTimelineStatus(app);
                    const activeIdx = TIMELINE_STEPS.indexOf(activeStatus as (typeof TIMELINE_STEPS)[number]);
                    const isRejected = activeStatus === "rejected";
                    const statusLabel = isRejected ? "Rejected" : activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1);
                    return (
                      <div key={app._id} className="surface-subtle space-y-3 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{app.internship?.role || "Internship"}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{app.internship?.company?.companyName || "Company"} • Applied {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "-"}</p>
                          </div>
                          <p className={`rounded-full px-2 py-1 text-xs font-semibold ${isRejected ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"}`}>
                            {isRejected ? "Rejected" : `Current: ${statusLabel}`}
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
                          {TIMELINE_STEPS.map((step, idx) => {
                            const done = idx <= activeIdx && !(isRejected && step === "selected");
                            const rejectedStep = step === "rejected";
                            return (
                              <div
                                key={`${app._id}-${step}`}
                                className={`rounded-lg border px-2 py-2 text-center text-xs font-medium ${
                                  rejectedStep && isRejected
                                    ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300"
                                    : done
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                                      : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                }`}
                              >
                                {step === "applied" && "Applied"}
                                {step === "reviewed" && "Application Reviewed"}
                                {step === "shortlisted" && "Shortlisted"}
                                {step === "interview_scheduled" && "Interview Scheduled"}
                                {step === "interview_completed" && "Interview Completed"}
                                {step === "selected" && "Selected"}
                                {step === "rejected" && "Rejected"}
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                          <p>Availability: {app.availabilityStatus === "yes" ? "Available now" : app.availabilityStatus === "no" ? `Available from ${app.joiningDate ? new Date(app.joiningDate).toLocaleDateString() : "-"}` : "-"}</p>
                          <p>Current Stage: <span className="font-semibold capitalize">{app.status.replace(/_/g, " ")}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionPanel>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
