"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { clearAuthSession } from "@/lib/session";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import {
  Application,
  InternProfile,
  fetchInternApplications,
  fetchInternProfile,
  openApplicationResume,
  withdrawApplication
} from "@/lib/intern-portal";
import { SkillChips } from "@/components/dashboard/skill-chips";
import { ExternalLink } from "@/components/ui/external-link";
import { ApplicationPipelineStepper } from "@/components/dashboard/application-pipeline-stepper";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { useToast } from "@/components/ui/toast";
import { ReportDownloadButton } from "@/components/reports/report-download-button";
import { BrandedEmptyState } from "@/components/dashboard/empty-state";
import { StatusBadge } from "@/components/icons/status-badge";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";

const WITHDRAW_BLOCKED = new Set(["selected", "offered", "rejected", "withdrawn"]);

export default function InternApplicationsPage() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
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
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Internships"
            title="My Applications"
            subtitle="Track pipeline stages, interviews, and recruiter feedback."
            actions={
              <>
                <ReportDownloadButton reportKey="application-history" label="Application History PDF" />
                <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern/track-progress")}>
                  Timeline View
                </Button>
              </>
            }
          />

          {loading && <div className="surface-muted p-4 text-sm text-slate-700 dark:text-slate-300">Loading applications...</div>}
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">{error}</div>}

          {!loading && !error && applications.length === 0 && (
            <BrandedEmptyState preset={BRANDED_EMPTY_STATES.applications} presetKey="applications" />
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
                      <div className="mt-1">
                        <StatusBadge status={app.status} />
                      </div>
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
                  <div className="mt-4">
                    <ApplicationPipelineStepper status={app.status} compact />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedApplication(app)}>
                      View Details
                    </Button>
                    {!WITHDRAW_BLOCKED.has(app.status) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await withdrawApplication(app._id);
                            const refreshed = await fetchInternApplications(true);
                            setApplications(refreshed);
                            pushToast({ variant: "success", title: "Application withdrawn" });
                          } catch (err) {
                            pushToast({ variant: "error", title: "Withdraw failed", message: (err as Error).message });
                          }
                        }}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </SectionPanel>
              ))}
            </div>
          )}
        </div>
        {selectedApplication && (
          <div className="fixed inset-0 z-[1000] bg-slate-950/45 p-4" onClick={() => setSelectedApplication(null)}>
            <div className="mx-auto mt-8 max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.internship?.role || "Internship"}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedApplication.internship?.company?.companyName || "Company"}</p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedApplication(null)}>Close</Button>
              </div>
              <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4 text-sm">
                <section className="surface-subtle p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Job Description</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedApplication.internship?.description || "Not specified"}</p>
                </section>
                <section className="surface-subtle p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Roles & Responsibilities</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">{selectedApplication.internship?.responsibilities || "Not specified"}</p>
                </section>
                <section className="surface-subtle p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Required Skills</p>
                  <div className="mt-2">
                    <SkillChips skills={selectedApplication.internship?.skillsRequired || []} />
                  </div>
                </section>
                <section className="grid gap-2 sm:grid-cols-2">
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Stipend</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.internship?.stipend || "Not specified"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Location</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.internship?.location || "Not specified"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Work Mode</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.internship?.mode || "Not specified"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Applied Date</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.appliedAt ? new Date(selectedApplication.appliedAt).toLocaleDateString() : "-"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Availability</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.availabilityStatus === "yes" ? "Available immediately" : selectedApplication.availabilityStatus === "no" ? "Not immediately available" : "-"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Available From</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.joiningDate ? new Date(selectedApplication.joiningDate).toLocaleDateString() : "-"}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Current Status</p><p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-100">{selectedApplication.status.replace(/_/g, " ")}</p></div>
                  <div className="surface-subtle px-3 py-2.5"><p className="text-xs text-slate-500">Relevance Score</p><p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApplication.relevanceScore ?? selectedApplication.matchScore ?? 0}%</p></div>
                </section>
                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Pipeline Progress</p>
                  <ApplicationPipelineStepper status={selectedApplication.status} />
                </section>
                {(selectedApplication.hrFeedback || []).length > 0 && (
                  <section className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">HR Feedback</p>
                    <ul className="mt-2 space-y-2">
                      {selectedApplication.hrFeedback.map((item, idx) => (
                        <li key={idx} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                          <p className="text-slate-700 dark:text-slate-300">{item.feedback}</p>
                          {item.rating && <p className="mt-1 text-xs text-primary-600 dark:text-primary-300">Rating: {item.rating}/5</p>}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {(selectedApplication.interviewRounds || []).length > 0 && (
                  <section className="surface-subtle p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Interview Rounds</p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {selectedApplication.interviewRounds?.map((round, idx) => (
                        <li key={round._id || idx} className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-semibold capitalize">{round.roundType || "Interview"} · {round.status || "scheduled"}</p>
                          <p className="text-xs text-slate-500">
                            {round.interviewDate ? new Date(round.interviewDate).toLocaleDateString() : "-"} {round.interviewTime || ""}
                            {round.mode ? ` · ${round.mode}` : ""}
                          </p>
                          {round.meetingLink && (
                            <ExternalLink href={round.meetingLink} className="mt-1 text-xs">
                              Join meeting
                            </ExternalLink>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        await openApplicationResume(selectedApplication._id);
                      } catch (err) {
                        pushToast({ variant: "error", title: "Resume unavailable", message: (err as Error).message });
                      }
                    }}
                  >
                    View Submitted Resume
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
