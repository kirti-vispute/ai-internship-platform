"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/shared/dashboard-page-header";
import { SectionPanel } from "@/components/dashboard/shared/section-panel";
import { BrandedEmptyState, EmptyState } from "@/components/dashboard/shared/empty-state";
import { ErrorState, classifyErrorMessage } from "@/components/errors/error-state";
import { BRANDED_EMPTY_STATES } from "@/lib/brand";
import { BarChart3, ClipboardList, LayoutGrid, Pencil, Sparkles } from "lucide-react";
import { RecentMessagesWidget } from "@/components/dashboard/chat/recent-messages-widget";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/icons/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { shouldBlockPageContent } from "@/lib/instant-load";
import {
  Application,
  InAppNotification,
  InternProfile,
  InternshipListing,
  Recommendation,
  fetchInternApplications,
  fetchInternInterviews,
  fetchInternNotifications,
  fetchInternProfile,
  fetchInternProfileWithScore,
  fetchInternRecommendations,
  fetchSavedInternships,
  peekInternApplications,
  peekInternProfile,
  peekSavedInternships,
  PROFILE_UPDATED_EVENT
} from "@/lib/intern-portal";
import { mapApiInterviewsToRecords, type ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { UpcomingInterviewsWidget } from "@/components/dashboard/intern/upcoming-interviews-widget";
import { WeaknessAnalysisPanel } from "@/components/dashboard/intern/weakness-analysis-panel";
import { buildWeaknessOptions, analyzeInternshipWeaknesses } from "@/lib/intern-weakness-analysis";
import {
  AtsReadinessCard,
  DashboardHero,
  PlacementReadinessCard,
  SkillGapCard,
  getPlacementReadiness
} from "@/components/dashboard/intern/dashboard-overview-cards";
import {
  ActivityTimeline,
  DashboardCharts,
  QuickActions,
  RecommendationsCard,
  StatisticsCards
} from "@/components/dashboard/intern/dashboard-overview-extras";
import { CareerProgressHub } from "@/components/dashboard/intern/career-progress-hub";
import { WeeklyAiInsights } from "@/components/dashboard/intern/weekly-ai-insights";
import { ProgressChartsPanel } from "@/components/dashboard/intern/progress-charts-panel";
import { DashboardTabs, type DashboardTabItem } from "@/components/dashboard/shared/dashboard-tabs";
import {
  AchievementsSection,
  CareerReadinessSection,
  PlacementReadinessTiersSection,
  PriorityRoadmapSection,
  TodaysFocusSection
} from "@/components/dashboard/intern/career-coach-dashboard";

export default function InternDashboardOverviewPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewRecords, setInterviewRecords] = useState<ScheduledInterviewRecord[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [savedInternships, setSavedInternships] = useState<InternshipListing[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cachedProfile = peekInternProfile();
    const cachedApps = peekInternApplications();
    const cachedSaved = peekSavedInternships();
    if (cachedProfile) setProfile(cachedProfile);
    if (cachedApps?.length) setApplications(cachedApps);
    if (cachedSaved?.length) setSavedInternships(cachedSaved);
    if (cachedProfile || cachedApps?.length) setLoading(false);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      setRecommendationsLoading(true);
      const loadedProfile = await fetchInternProfile();
      setProfile(loadedProfile);

      const recommendationSkills =
        loadedProfile.resume?.parsed?.skills?.length ? loadedProfile.resume.parsed.skills : loadedProfile.skills;

      const [apps, interviews, recommendationList, alerts, saved] = await Promise.all([
        fetchInternApplications(),
        fetchInternInterviews().catch(() => []),
        fetchInternRecommendations(recommendationSkills).catch(() => []),
        fetchInternNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
        fetchSavedInternships().catch(() => [])
      ]);

      void fetchInternProfileWithScore()
        .then((scored) => setProfile(scored))
        .catch(() => undefined);

      setApplications(apps || []);
      setInterviewRecords(mapApiInterviewsToRecords(interviews || []));
      setRecommendations(recommendationList || []);
      setNotifications((alerts.notifications || []).slice(0, 5));
      setSavedInternships(saved || []);

      const missing = new Set<string>();
      (recommendationList || []).forEach((item) => {
        (item.missingRequiredSkills || []).forEach((skill) => missing.add(skill));
      });
      setMissingSkills(Array.from(missing).slice(0, 5));
    } catch (err) {
      setError((err as Error).message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    // `profile` here is set once by loadDashboard on mount. A resume upload
    // or profile edit elsewhere invalidates the shared cache but doesn't
    // touch this component's local state -- without this listener the hero
    // name/readiness card would keep showing whatever was true at mount
    // until the user navigates away and back.
    const syncProfile = () => {
      fetchInternProfile(true).then(setProfile).catch(() => undefined);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, syncProfile);
    window.addEventListener("internai-auth-change", syncProfile);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, syncProfile);
      window.removeEventListener("internai-auth-change", syncProfile);
    };
  }, []);

  const interviewCount = useMemo(() => interviewRecords.length, [interviewRecords]);

  const weaknessOptions = useMemo(
    () => buildWeaknessOptions(recommendations, applications),
    [recommendations, applications]
  );

  const topWeakness = useMemo(() => {
    const analysis = analyzeInternshipWeaknesses(profile, weaknessOptions[0] ?? null);
    return analysis?.weaknesses[0] ?? null;
  }, [profile, weaknessOptions]);

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

  const readiness = useMemo(
    () => getPlacementReadiness(profile?.resume?.analysis, profile?.resume?.score ?? 0),
    [profile]
  );

  const recentApplications = applications.slice(0, 5);

  const tabs = useMemo(() => {
    const items: DashboardTabItem[] = [
      {
        key: "overview",
        label: "Overview",
        icon: LayoutGrid,
        content: (
          <>
            <QuickActions />

            <SectionPanel title="Recent Notifications" subtitle="Latest updates from applications and recruiters.">
              {notifications.length === 0 ? (
                <BrandedEmptyState preset={BRANDED_EMPTY_STATES.notifications} presetKey="notifications" />
              ) : (
                <>
                  <ul className="space-y-2">
                    {notifications.slice(0, 3).map((item) => (
                      <li key={item._id} className="surface-subtle px-4 py-3">
                        <p className="text-sm font-semibold text-[var(--ds-text)]">{item.title}</p>
                        {item.message ? <p className="mt-0.5 text-xs text-[var(--ds-text-secondary)]">{item.message}</p> : null}
                        <p className="mt-1 text-[11px] text-[var(--ds-muted)]">{new Date(item.createdAt).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3">
                    <Button href="/dashboard/intern/notifications" type="button" size="sm" variant="secondary">
                      View all
                    </Button>
                  </div>
                </>
              )}
            </SectionPanel>

            <CareerReadinessSection readiness={readiness} analysis={profile?.resume?.analysis} profile={profile} />

            <TodaysFocusSection
              profile={profile}
              analysis={profile?.resume?.analysis}
              topWeakness={topWeakness}
              missingSkills={missingSkills}
            />

            <PriorityRoadmapSection profile={profile} analysis={profile?.resume?.analysis} />
          </>
        )
      },
      {
        key: "applications",
        label: "Applications & Interviews",
        icon: ClipboardList,
        content: (
          <>
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
                      <tr className="border-b border-[var(--ds-border)]">
                        <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">Role</th>
                        <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">Company</th>
                        <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">Applied On</th>
                        <th className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ds-muted)]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((app) => (
                        <tr key={app._id} className="border-b border-[var(--ds-border)] text-sm">
                          <td className="py-2.5 pr-2 font-medium text-[var(--ds-text)]">{app.internship?.role || "Internship"}</td>
                          <td className="py-2.5 pr-2 text-[var(--ds-text-secondary)]">{app.internship?.company?.companyName || "Company"}</td>
                          <td className="py-2.5 pr-2 text-[var(--ds-text-secondary)]">
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-2.5">
                            <span className="inline-flex rounded-full bg-[var(--ds-primary)]/10 px-2.5 py-1 text-xs font-semibold capitalize text-[var(--ds-primary)]">
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

            <UpcomingInterviewsWidget interviewRecords={interviewRecords} applications={applications} />
          </>
        )
      },
      {
        key: "insights",
        label: "Insights & Activity",
        icon: Sparkles,
        content: (
          <>
            <WeeklyAiInsights analysis={profile?.resume?.analysis} applications={applications} topWeakness={topWeakness} />
            <RecommendationsCard recommendations={recommendations} loading={recommendationsLoading} />

            <ActivityTimeline
              applications={applications}
              interviewRecords={interviewRecords}
              notifications={notifications}
            />

            <RecentMessagesWidget role="intern" chatHref="/dashboard/intern/chat" />
          </>
        )
      },
      {
        key: "progress",
        label: "Progress & Analytics",
        icon: BarChart3,
        content: (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AtsReadinessCard profile={profile} analysis={profile?.resume?.analysis} />
              <SkillGapCard analysis={profile?.resume?.analysis} />
              <PlacementReadinessCard readiness={readiness} analysis={profile?.resume?.analysis} />
            </section>

            <StatisticsCards
              profile={profile}
              analysis={profile?.resume?.analysis}
              profileCompletion={profileCompletion}
              applications={applications}
              interviewCount={interviewCount}
              savedCount={savedInternships.length}
            />

            <PlacementReadinessTiersSection readiness={readiness} />

            <CareerProgressHub profile={profile} analysis={profile?.resume?.analysis} readiness={readiness} />

            <AchievementsSection
              profile={profile}
              applications={applications}
              interviewCount={interviewCount}
              profileCompletion={profileCompletion}
            />
            <DashboardCharts applications={applications} analysis={profile?.resume?.analysis} />
            <ProgressChartsPanel applications={applications} interviewRecords={interviewRecords} />
            <WeaknessAnalysisPanel
              profile={profile}
              options={weaknessOptions}
              loading={recommendationsLoading}
              error={error}
              onRetry={loadDashboard}
            />
          </>
        )
      }
    ];
    return items;
  }, [
    profile,
    readiness,
    profileCompletion,
    applications,
    interviewCount,
    savedInternships,
    interviewRecords,
    weaknessOptions,
    recommendationsLoading,
    error,
    loadDashboard,
    recentApplications,
    topWeakness,
    recommendations,
    notifications,
    missingSkills
  ]);

  return (
    <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Intern Portal"
            title="Dashboard Overview"
            subtitle="Track applications, improve your profile, and discover internships matched to your skills."
            actions={
              <Button href="/dashboard/intern/profile/edit" type="button" size="sm" variant="secondary" className="gap-2">
                <AppIcon icon={Pencil} size="xs" className="text-current" />
                Edit Profile
              </Button>
            }
          />

          {error && (
            <ErrorState
              variant={classifyErrorMessage(error)}
              size="inline"
              description={error}
              onRetry={loadDashboard}
            />
          )}

          {shouldBlockPageContent(profile, applications) && loading ? (
            <div className="stat-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <DashboardHero profile={profile} analysis={profile?.resume?.analysis} profileCompletion={profileCompletion} readiness={readiness} />

              <DashboardTabs tabs={tabs} />
            </>
          )}
        </div>
  );
}
