"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { InterviewCalendar } from "@/components/dashboard/intern/interview-calendar";
import { ScheduledInterviewsPanel } from "@/components/dashboard/intern/scheduled-interviews-panel";
import { clearAuthSession } from "@/lib/session";
import {
  Application,
  checkInterviewReminders,
  fetchInternApplications,
  fetchInternProfileWithScore
} from "@/lib/intern-portal";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternInterviewsPage() {
  const router = useRouter();
  const [profileName, setProfileName] = useState<string | undefined>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const profile = await fetchInternProfileWithScore(true);
        setProfileName(profile.fullName);
        const apps = await fetchInternApplications(true);
        setApplications(apps || []);
        await checkInterviewReminders().catch(() => null);
      } catch (err) {
        setError((err as Error).message || "Failed to load interviews.");
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

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profileName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Intern Portal"
            title="Scheduled Interviews"
            subtitle="Track upcoming interviews, calendar views, and interview room access."
          />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              <ScheduledInterviewsPanel applications={applications} />
              <InterviewCalendar applications={applications} />
            </>
          )}
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
