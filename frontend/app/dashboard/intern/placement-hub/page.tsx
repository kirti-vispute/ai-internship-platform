"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/shared/dashboard-page-header";
import { ErrorState, classifyErrorMessage } from "@/components/errors/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { shouldBlockPageContent } from "@/lib/instant-load";
import {
  Application,
  InternProfile,
  fetchInternApplications,
  fetchInternInterviews,
  fetchInternProfile,
  fetchInternProfileWithScore,
  peekInternApplications,
  peekInternProfile,
  PROFILE_UPDATED_EVENT
} from "@/lib/intern-portal";
import { mapApiInterviewsToRecords, type ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { recordProgressHistory } from "@/lib/weekly-progress-tracker";
import { getPlacementReadiness } from "@/components/dashboard/intern/dashboard-overview-cards";
import { PriorityRoadmapSection } from "@/components/dashboard/intern/career-coach-dashboard";
import {
  CertificatesSection,
  MockTestProgressSection,
  RecommendedLearningSection,
  UpcomingDeadlinesSection,
  WeeklyStreakBanner
} from "@/components/dashboard/intern/placement-hub-sections";

export default function PlacementHubPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviewRecords, setInterviewRecords] = useState<ScheduledInterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cachedProfile = peekInternProfile();
    const cachedApps = peekInternApplications();
    if (cachedProfile) setProfile(cachedProfile);
    if (cachedApps?.length) setApplications(cachedApps);
    if (cachedProfile || cachedApps?.length) setLoading(false);
  }, []);

  const loadHub = useCallback(async () => {
    try {
      setError(null);
      const loadedProfile = await fetchInternProfile();
      setProfile(loadedProfile);

      const [apps, interviews] = await Promise.all([
        fetchInternApplications(),
        fetchInternInterviews().catch(() => [])
      ]);

      void fetchInternProfileWithScore()
        .then((scored) => setProfile(scored))
        .catch(() => undefined);

      setApplications(apps || []);
      setInterviewRecords(mapApiInterviewsToRecords(interviews || []));
    } catch (err) {
      setError((err as Error).message || "Failed to load placement hub.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHub();
  }, [loadHub]);

  useEffect(() => {
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

  const resumeScore = Math.round(profile?.resume?.analysis?.overallScore ?? profile?.resume?.score ?? 0);
  const atsScore = Math.round(
    profile?.resume?.analysis?.categoryScores?.ats ?? profile?.resume?.analysis?.compositeScores?.ats ?? 0
  );

  useEffect(() => {
    if (!profile) return;
    recordProgressHistory(profile._id || "anon", {
      resumeScore,
      atsScore,
      applications: applications.length,
      interviews: interviewRecords.length,
      profileCompletion,
      readiness: readiness.score
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?._id, resumeScore, atsScore, applications.length, interviewRecords.length, profileCompletion, readiness.score]);

  return (
    <div className="dashboard-stack">
      <DashboardPageHeader
        eyebrow="Intern Portal"
        title="AI Placement Preparation Hub"
        subtitle="Every AI-powered readiness signal -- resume, skills, roadmap, interviews, and tests -- in one place."
      />

      {error && <ErrorState variant={classifyErrorMessage(error)} size="inline" description={error} onRetry={loadHub} />}

      {shouldBlockPageContent(profile, applications) && loading ? (
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <WeeklyStreakBanner applications={applications} interviewRecords={interviewRecords} />

          <RecommendedLearningSection analysis={profile?.resume?.analysis} />

          <PriorityRoadmapSection profile={profile} analysis={profile?.resume?.analysis} />

          <UpcomingDeadlinesSection applications={applications} interviewRecords={interviewRecords} />

          <MockTestProgressSection />

          <CertificatesSection />
        </>
      )}
    </div>
  );
}
