"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { ScheduledInterviewsPanel } from "@/components/dashboard/intern/scheduled-interviews-panel";
import {
  fetchInternInterviews,
  peekInternApplications,
  type ScheduledInterview
} from "@/lib/intern-portal";
import {
  mapApiInterviewToRecord,
  mapApiInterviewsToRecords,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternInterviewsPage() {
  const [interviewRecords, setInterviewRecords] = useState<ScheduledInterviewRecord[]>([]);
  const [pastInterviewRecords, setPastInterviewRecords] = useState<ScheduledInterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const cachedApps = peekInternApplications();
    if (cachedApps?.length) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const interviews: ScheduledInterview[] = await fetchInternInterviews(true);
        const allRecords = interviews.map(mapApiInterviewToRecord);
        setInterviewRecords(mapApiInterviewsToRecords(interviews));
        setPastInterviewRecords(
          allRecords.filter(
            (item) => item.interviewStatus === "completed" || item.interviewStatus === "cancelled"
          )
        );
      } catch (err) {
        setError((err as Error).message || "Failed to load interviews.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const allApiInterviews = useMemo(() => interviewRecords, [interviewRecords]);

  return (
    <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Intern Portal"
            title="Scheduled Interviews"
            subtitle="Track upcoming interviews and interview room access."
          />

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : (
            <ScheduledInterviewsPanel interviewRecords={allApiInterviews} pastInterviewRecords={pastInterviewRecords} />
          )}
    </div>
  );
}
