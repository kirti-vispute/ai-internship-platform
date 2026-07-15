"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MessageSquare } from "lucide-react";
import type { Application } from "@/lib/intern-portal";
import {
  extractPastInterviews,
  extractScheduledInterviews,
  formatInterviewDateTime,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import { formatInterviewJoinHint } from "@/lib/interview-join";
import { useInterviewCountdown } from "@/lib/use-interview-countdown";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";
import { InterviewDetailsModal } from "@/components/dashboard/interview/interview-details-modal";
import { InterviewJoinButton } from "@/components/dashboard/interview/interview-join-button";

function InterviewCountdownHint({ item }: { item: ScheduledInterviewRecord }) {
  const countdown = useInterviewCountdown(item.interviewDate, item.interviewTime);
  if (!countdown) return null;
  return <p className="text-xs font-medium text-primary-700 dark:text-primary-300">Starts in {countdown.label}</p>;
}

type ScheduledInterviewsPanelProps = {
  applications?: Application[];
  interviewRecords?: ScheduledInterviewRecord[];
  pastInterviewRecords?: ScheduledInterviewRecord[];
  compact?: boolean;
};

export function ScheduledInterviewsPanel({
  applications = [],
  interviewRecords,
  pastInterviewRecords,
  compact = false
}: ScheduledInterviewsPanelProps) {
  const [selected, setSelected] = useState<ScheduledInterviewRecord | null>(null);
  const interviews = useMemo(
    () => interviewRecords ?? extractScheduledInterviews(applications),
    [applications, interviewRecords]
  );
  const pastInterviews = useMemo(
    () => pastInterviewRecords ?? extractPastInterviews(applications),
    [applications, pastInterviewRecords]
  );
  const visible = compact ? interviews.slice(0, 5) : interviews;

  return (
    <>
      <SectionPanel
        title="Scheduled Interviews"
        subtitle="Track every upcoming and active interview in one place."
        titleIcon={CalendarDays}
      >
        {compact ? (
          <div className="mb-3 flex justify-end">
            <Button type="button" size="sm" variant="secondary" href="/dashboard/intern/interviews">
              View all
            </Button>
          </div>
        ) : null}
        {visible.length === 0 ? (
          <div className="surface-subtle px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
            No interviews scheduled yet. When a recruiter schedules your interview, it will appear here immediately.
          </div>
        ) : (
          <div className="grid gap-3">
            {visible.map((item) => {
              const joinHint = formatInterviewJoinHint(item);
              return (
                <article
                  key={item.interviewId}
                  className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-200 dark:border-slate-700 dark:bg-slate-900/70 dark:hover:border-primary-900/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.companyName}</h3>
                      <InterviewStatusChip status={item.interviewStatus} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {item.role} · {item.interviewType}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatInterviewDateTime(item.interviewDate, item.interviewTime)}
                    </p>
                    {joinHint ? <p className="text-xs text-primary-700 dark:text-primary-300">{joinHint}</p> : null}
                    <InterviewCountdownHint item={item} />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(item)}>
                      View Details
                    </Button>
                    <Button type="button" size="sm" variant="ghost" href="/dashboard/intern/chat">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message Recruiter
                    </Button>
                    <InterviewJoinButton interview={item} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </SectionPanel>

      {!compact && pastInterviews.length > 0 ? (
        <SectionPanel title="Interview History" subtitle="Completed and cancelled interviews from your applications.">
          <div className="grid gap-3">
            {pastInterviews.slice(0, 10).map((item) => (
              <article
                key={`past-${item.interviewId}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{item.companyName}</h3>
                    <InterviewStatusChip status={item.interviewStatus} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {item.role} · {item.interviewType}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatInterviewDateTime(item.interviewDate, item.interviewTime)}
                  </p>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelected(item)}>
                  View Details
                </Button>
              </article>
            ))}
          </div>
        </SectionPanel>
      ) : null}

      <InterviewDetailsModal open={Boolean(selected)} interview={selected} onClose={() => setSelected(null)} />
    </>
  );
}
