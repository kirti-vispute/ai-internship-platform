"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react";
import type { Application } from "@/lib/intern-portal";
import type { CompanyApplication } from "@/lib/company-portal";
import type { CalendarDayEntry } from "@/lib/calendar-stickers";
import {
  extractScheduledInterviews,
  formatInterviewDateTime,
  formatInterviewTimeLabel,
  getCalendarEventLabel,
  groupInterviewsByDate,
  isSameCalendarDay,
  toLocalDateKey,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import {
  fetchCalendarEntries,
  groupCalendarEntriesByDate,
  monthGridDateRange,
  weekDateRange
} from "@/lib/calendar-personalization";
import { CalendarDayEditor } from "@/components/calendar/calendar-day-editor";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";
import { InterviewDetailsModal } from "@/components/dashboard/interview/interview-details-modal";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "timeline";

type InterviewCalendarProps = {
  applications?: Application[] | CompanyApplication[];
  interviewRecords?: ScheduledInterviewRecord[];
  audience?: "intern" | "company";
};

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function InterviewCalendar({ applications = [], interviewRecords, audience = "intern" }: InterviewCalendarProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<ScheduledInterviewRecord | null>(null);
  const [personalEntries, setPersonalEntries] = useState<CalendarDayEntry[]>([]);

  const interviews = useMemo(
    () => interviewRecords ?? extractScheduledInterviews(applications),
    [applications, interviewRecords]
  );
  const grouped = useMemo(() => groupInterviewsByDate(interviews), [interviews]);
  const personalByDate = useMemo(() => groupCalendarEntriesByDate(personalEntries), [personalEntries]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        return day;
      }),
    [weekStart]
  );

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [cursor]);

  const fetchRangeFrom = useMemo(() => {
    if (view === "week") return weekDateRange(weekStart).from;
    if (view === "month") return monthGridDateRange(cursor).from;
    return null;
  }, [view, cursor, weekStart]);

  const fetchRangeTo = useMemo(() => {
    if (view === "week") return weekDateRange(weekStart).to;
    if (view === "month") return monthGridDateRange(cursor).to;
    return null;
  }, [view, cursor, weekStart]);

  useEffect(() => {
    if (!fetchRangeFrom || !fetchRangeTo) return;
    let cancelled = false;

    fetchCalendarEntries(fetchRangeFrom, fetchRangeTo)
      .then((entries) => {
        if (cancelled) return;
        setPersonalEntries((current) => {
          const outside = current.filter(
            (entry) => entry.dateKey < fetchRangeFrom || entry.dateKey > fetchRangeTo
          );
          return [...outside, ...entries];
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPersonalEntries((current) =>
            current.filter((entry) => entry.dateKey < fetchRangeFrom || entry.dateKey > fetchRangeTo)
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRangeFrom, fetchRangeTo]);

  const eventsForDay = useCallback(
    (day: Date) => {
      const key = toLocalDateKey(day);
      return grouped.get(key) || [];
    },
    [grouped]
  );

  const updateDayEntries = useCallback((dateKey: string, nextEntries: CalendarDayEntry[]) => {
    setPersonalEntries((current) => {
      const withoutDay = current.filter((entry) => entry.dateKey !== dateKey);
      return [...withoutDay, ...nextEntries];
    });
  }, []);

  const subtitle =
    audience === "company"
      ? "Monthly, weekly, and timeline views for recruiter interview schedules — decorate dates with stickers and notes."
      : "Decorate dates with emoji stickers and notes, and view your interview schedule.";

  return (
    <>
      <SectionPanel title="Personal Calendar" subtitle={subtitle} titleIcon={Calendar}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            {(["month", "week", "timeline"] as CalendarView[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  view === mode
                    ? "bg-primary-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {mode === "timeline" ? "Timeline" : `${mode} view`}
              </button>
            ))}
          </div>

          {view !== "timeline" ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCursor((current) => {
                    const next = new Date(current);
                    if (view === "month") next.setMonth(current.getMonth() - 1);
                    else next.setDate(current.getDate() - 7);
                    return next;
                  })
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[10rem] text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                {view === "month" ? monthLabel : `Week of ${weekStart.toLocaleDateString()}`}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setCursor((current) => {
                    const next = new Date(current);
                    if (view === "month") next.setMonth(current.getMonth() + 1);
                    else next.setDate(current.getDate() + 7);
                    return next;
                  })
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>

        {view === "month" ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                <div key={label} className="px-2 py-2">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayKey = toLocalDateKey(day);
                const events = eventsForDay(day);
                const inMonth = day.getMonth() === cursor.getMonth();
                const isToday = isSameCalendarDay(day, new Date());
                const dayEntries = personalByDate.get(dayKey) || [];
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "min-h-32 border-b border-r border-slate-100 p-2 dark:border-slate-800",
                      !inMonth && "bg-slate-50/60 dark:bg-slate-950/40",
                      isToday && "bg-primary-50/50 dark:bg-primary-950/20"
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        inMonth ? "text-slate-900 dark:text-slate-100" : "text-slate-400",
                        isToday && "text-primary-700 dark:text-primary-300"
                      )}
                    >
                      {day.getDate()}
                    </p>
                    <CalendarDayEditor
                      dateKey={dayKey}
                      entries={dayEntries}
                      variant="compact"
                      className="mt-1"
                      onEntriesChange={(next) => updateDayEntries(dayKey, next)}
                    />
                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <button
                          key={event.interviewId}
                          type="button"
                          onClick={() => setSelected(event)}
                          className="block w-full truncate rounded-md bg-primary-100 px-1.5 py-1 text-left text-[10px] font-medium text-primary-800 dark:bg-primary-950/50 dark:text-primary-200"
                          title={formatInterviewDateTime(event.interviewDate, event.interviewTime)}
                        >
                          {formatInterviewTimeLabel(event.interviewTime)} {getCalendarEventLabel(event, audience)}
                        </button>
                      ))}
                      {events.length > 2 ? (
                        <p className="px-1 text-[10px] text-slate-500">+{events.length - 2} more</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {view === "week" ? (
          <div className="grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => {
              const dayKey = toLocalDateKey(day);
              const events = eventsForDay(day);
              const dayEntries = personalByDate.get(dayKey) || [];
              const isToday = isSameCalendarDay(day, new Date());
              return (
                <div
                  key={dayKey}
                  className={cn(
                    "rounded-2xl border border-slate-200 p-3 dark:border-slate-700",
                    isToday && "border-primary-300 bg-primary-50/40 dark:border-primary-800 dark:bg-primary-950/20"
                  )}
                >
                  <div className="rounded-lg text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {day.toLocaleDateString(undefined, { weekday: "short" })}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{day.getDate()}</p>
                  </div>
                  <CalendarDayEditor
                    dateKey={dayKey}
                    entries={dayEntries}
                    variant="full"
                    className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700"
                    onEntriesChange={(next) => updateDayEntries(dayKey, next)}
                  />
                  <div className="mt-3 space-y-2">
                    {events.length === 0 ? (
                      <p className="text-xs text-slate-500">No interviews</p>
                    ) : (
                      events.map((event) => (
                        <button
                          key={event.interviewId}
                          type="button"
                          onClick={() => setSelected(event)}
                          className="w-full rounded-xl border border-primary-200/70 bg-primary-50/70 p-2 text-left dark:border-primary-900/40 dark:bg-primary-950/20"
                        >
                          <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {getCalendarEventLabel(event, audience)}
                          </p>
                          <p className="truncate text-[11px] text-slate-600 dark:text-slate-300">{event.role}</p>
                          <p className="text-[10px] text-slate-500">{formatInterviewTimeLabel(event.interviewTime)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {view === "timeline" ? (
          <div className="space-y-3">
            {interviews.length === 0 ? (
              <div className="surface-subtle px-4 py-5 text-sm text-slate-600 dark:text-slate-300">
                Your interview timeline will populate once interviews are scheduled.
              </div>
            ) : (
              interviews.map((event) => (
                <button
                  key={event.interviewId}
                  type="button"
                  onClick={() => setSelected(event)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-primary-200 dark:border-slate-700 dark:hover:border-primary-900/50"
                >
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                    <List className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {getCalendarEventLabel(event, audience)}
                      </p>
                      <InterviewStatusChip status={event.interviewStatus} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {event.role} · {event.interviewType}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {formatInterviewDateTime(event.interviewDate, event.interviewTime)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}
      </SectionPanel>

      <InterviewDetailsModal
        open={Boolean(selected)}
        interview={selected}
        audience={audience}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
