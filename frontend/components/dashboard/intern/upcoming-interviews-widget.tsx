"use client";

import { useMemo } from "react";
import { CalendarClock, Timer } from "lucide-react";
import type { Application } from "@/lib/intern-portal";
import {
  extractUpcomingInterviewRecords,
  extractUpcomingInterviews,
  formatInterviewDateTime,
  getCountdownParts,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import { useTickingNow } from "@/lib/use-interview-countdown";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { InterviewJoinButton } from "@/components/dashboard/interview/interview-join-button";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";

type UpcomingInterviewsWidgetProps = {
  applications?: Application[];
  interviewRecords?: ScheduledInterviewRecord[];
};

export function UpcomingInterviewsWidget({ applications = [], interviewRecords }: UpcomingInterviewsWidgetProps) {
  const now = useTickingNow();
  const upcoming = useMemo(
    () =>
      interviewRecords
        ? extractUpcomingInterviewRecords(interviewRecords, 3)
        : extractUpcomingInterviews(applications, 3),
    [applications, interviewRecords]
  );

  return (
    <SectionPanel
      title="Upcoming Interviews"
      subtitle="Your next scheduled interviews with live countdown."
      titleIcon={CalendarClock}
      className="company-dashboard-hero-accent"
    >
      {upcoming.length === 0 ? (
        <div className="surface-subtle px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
          No upcoming interviews yet. Shortlisted applications will appear here once scheduled.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {upcoming.map((item, index) => {
            const countdown =
              now === null ? null : getCountdownParts(item.interviewDate, item.interviewTime, now);
            return (
              <article
                key={item.interviewId}
                className="interview-countdown-card flex h-full flex-col rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50/90 via-white to-violet-50/70 p-4 shadow-sm dark:border-primary-900/40 dark:from-primary-950/30 dark:via-slate-900 dark:to-violet-950/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700 dark:text-primary-300">
                      {index === 0 ? "Next Interview" : `Interview ${index + 1}`}
                    </p>
                    <h3 className="mt-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.role}
                    </h3>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-300">{item.companyName}</p>
                  </div>
                  <InterviewStatusChip status={item.interviewStatus} />
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {formatInterviewDateTime(item.interviewDate, item.interviewTime)}
                </p>

                {now !== null && countdown ? (
                  <div className="mt-4 rounded-xl border border-primary-200/70 bg-white/70 px-3 py-3 dark:border-primary-900/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-700 dark:text-primary-300">
                      <Timer className="h-3.5 w-3.5" />
                      Interview in
                    </div>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                      {countdown.days > 0 ? `${countdown.days} Days ` : ""}
                      {countdown.hours} Hours
                    </p>
                  </div>
                ) : null}

                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <InterviewJoinButton interview={item} className="w-full" />
                  <Button type="button" size="sm" variant="secondary" href="/dashboard/intern/interviews" className="w-full">
                    View Details
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SectionPanel>
  );
}
