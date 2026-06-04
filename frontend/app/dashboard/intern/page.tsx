"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { SummaryStatCard } from "@/components/dashboard/summary-stat-card";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { BrandedEmptyState, EmptyState } from "@/components/dashboard/empty-state";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";
import {
  BarChart3,
  Briefcase,
  Calendar,
  ClipboardList,
  Pencil,
  Sparkles,
  Target,
  User
} from "lucide-react";
import { RecentMessagesWidget } from "@/components/dashboard/recent-messages-widget";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { clearAuthSession } from "@/lib/session";
import {
  Application,
  InAppNotification,
  InternProfile,
  fetchInternApplications,
  fetchInternNotifications,
  fetchInternProfileWithScore,
  fetchInternRecommendations
} from "@/lib/intern-portal";

export default function InternDashboardOverviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const loadedProfile = await fetchInternProfileWithScore(true);
        setProfile(loadedProfile);

        const recommendationSkills =
          loadedProfile.resume?.parsed?.skills?.length ? loadedProfile.resume.parsed.skills : loadedProfile.skills;

        const [apps, recommendations, alerts] = await Promise.all([
          fetchInternApplications(true),
          fetchInternRecommendations(recommendationSkills, true).catch(() => []),
          fetchInternNotifications(true).catch(() => ({ notifications: [], unreadCount: 0 }))
        ]);

        setApplications(apps || []);
        setRecommendationCount(recommendations?.length || 0);
        setNotifications((alerts.notifications || []).slice(0, 5));

        const missing = new Set<string>();
        (recommendations || []).forEach((item) => {
          (item.missingRequiredSkills || []).forEach((skill) => missing.add(skill));
        });
        setMissingSkills(Array.from(missing).slice(0, 5));
      } catch (err) {
        setError((err as Error).message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const interviewCount = useMemo(
    () =>
      applications.reduce((total, app) => {
        const rounds = app.interviewRounds || [];
        return total + rounds.filter((round) => round.status === "scheduled").length;
      }, 0),
    [applications]
  );

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.fullName),
      Boolean(profile.mobile),
      (profile.skills || []).length > 0,
      Boolean(profile.summary),
      profile.resumeUploaded
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  function handleLogout() {
    clearAuthSession();
    router.push("/auth/intern");
  }

  const recentApplications = applications.slice(0, 5);
  const nextSteps = useMemo(() => {
    if (!profile) return [];
    const steps: string[] = [];
    if (!profile.resumeUploaded) steps.push("Upload Resume");
    if (profileCompletion < 100) steps.push("Complete Profile");
    if ((profile.certifications || []).length === 0 && (profile.certificationEntries || []).length === 0) {
      steps.push("Add Certifications");
    }
    if ((profile.resume?.score || 0) < 75) steps.push("Improve Resume Score");
    if (missingSkills.length > 0) steps.push("Missing Skills");
    return steps;
  }, [profile, profileCompletion, missingSkills]);

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Intern Portal"
            title="Dashboard Overview"
            subtitle="Track applications, improve your profile, and discover internships matched to your skills."
            actions={
              <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={() => router.push("/dashboard/intern/profile/edit")}>
                <AppIcon icon={Pencil} size="xs" className="text-current" />
                Edit Profile
              </Button>
            }
          />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="stat-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <SectionPanel title="Welcome" subtitle="Your internship readiness snapshot for today." titleIcon={Sparkles}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="surface-subtle flex gap-3 px-4 py-3">
                    <AppIcon icon={User} className="mt-0.5 text-primary-600 dark:text-primary-400" />
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Student</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{profile?.fullName || "Intern"}</p>
                    </div>
                  </div>
                  <div className="surface-subtle flex gap-3 px-4 py-3">
                    <AppIcon icon={Target} className="mt-0.5 text-primary-600 dark:text-primary-400" />
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Profile Completion</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{profileCompletion}%</p>
                    </div>
                  </div>
                  <div className="surface-subtle flex gap-3 px-4 py-3">
                    <AppIcon icon={BarChart3} className="mt-0.5 text-primary-600 dark:text-primary-400" />
                    <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Resume Score</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{profile?.resume?.score ?? 0}/100</p>
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <SummaryStatCard title="Applications" value={applications.length} hint="Total submitted applications." icon={ClipboardList} />
                <SummaryStatCard title="Interviews Scheduled" value={interviewCount} hint="Upcoming interview rounds." icon={Calendar} />
                <SummaryStatCard title="Recommended Internships" value={recommendationCount} hint="Matched opportunities for your profile." icon={Briefcase} />
              </section>

              <SectionPanel title="Recent Applications" subtitle="Latest activity across your internship pipeline." titleIcon={ClipboardList}>
                {recentApplications.length === 0 ? (
                  <EmptyState
                    title="No applications yet"
                    hint="Search internships and submit your first application."
                    presetKey="applications"
                    action={
                      <Button href="/dashboard/intern/internships/search" type="button" size="sm">
                        Search Internships
                      </Button>
                    }
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</th>
                          <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Company</th>
                          <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Applied On</th>
                          <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.map((app) => (
                          <tr key={app._id} className="border-b border-slate-100 text-sm dark:border-slate-800/70">
                            <td className="py-2.5 pr-2 font-medium text-slate-900 dark:text-slate-100">{app.internship?.role || "Internship"}</td>
                            <td className="py-2.5 pr-2 text-slate-600 dark:text-slate-300">{app.internship?.company?.companyName || "Company"}</td>
                            <td className="py-2.5 pr-2 text-slate-600 dark:text-slate-300">
                              {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-2.5">
                              <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold capitalize text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                {(app.status || "pending").replace(/_/g, " ")}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pt-3">
                      <Button href="/dashboard/intern/applications" type="button" size="sm" variant="secondary">
                        View all applications
                      </Button>
                    </div>
                  </div>
                )}
              </SectionPanel>

              <SectionPanel title="Next Steps" subtitle="Priority actions to improve matching and hiring outcomes.">
                {nextSteps.length === 0 ? (
                  <p className="surface-subtle px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    Great progress. Keep monitoring applications and interview updates.
                  </p>
                ) : (
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {nextSteps.includes("Upload Resume") && (
                      <li className="surface-subtle px-4 py-3">Upload Resume</li>
                    )}
                    {nextSteps.includes("Complete Profile") && (
                      <li className="surface-subtle px-4 py-3">Complete Profile</li>
                    )}
                    {nextSteps.includes("Add Certifications") && (
                      <li className="surface-subtle px-4 py-3">Add Certifications</li>
                    )}
                    {nextSteps.includes("Improve Resume Score") && (
                      <li className="surface-subtle px-4 py-3">Improve Resume Score</li>
                    )}
                    {nextSteps.includes("Missing Skills") && (
                      <li className="surface-subtle px-4 py-3">
                        Missing Skills{missingSkills.length > 0 ? `: ${missingSkills.join(", ")}` : ""}
                      </li>
                    )}
                  </ul>
                )}
              </SectionPanel>

              <RecentMessagesWidget role="intern" chatHref="/dashboard/intern/chat" />

              <SectionPanel title="Recent Notifications" subtitle="Latest updates from applications and recruiters.">
                {notifications.length === 0 ? (
                  <BrandedEmptyState preset={BRANDED_EMPTY_STATES.notifications} presetKey="notifications" />
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((item) => (
                      <li key={item._id} className="surface-subtle px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                        {item.message ? <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.message}</p> : null}
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionPanel>
            </>
          )}
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
