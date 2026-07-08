"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Award,
  CalendarDays,
  CalendarRange,
  CalendarX2,
  ChevronLeft,
  ChevronRight,
  Code2,
  List,
  MapPin,
  Plus,
  RotateCcw,
  StickyNote,
  Users,
  Video,
  type LucideIcon
} from "lucide-react";
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
  type InterviewDisplayStatus,
  type ScheduledInterviewRecord
} from "@/lib/interview-workflow";
import {
  fetchCalendarEntries,
  groupCalendarEntriesByDate,
  monthGridDateRange,
  weekDateRange
} from "@/lib/calendar-personalization";
import { CalendarDayDetailModal } from "@/components/calendar/calendar-day-detail-modal";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Button } from "@/components/ui/button";
import { InterviewStatusChip } from "@/components/dashboard/interview/interview-status-chip";
import { InterviewDetailsModal } from "@/components/dashboard/interview/interview-details-modal";
import { cn } from "@/lib/utils";

type CalendarView = "month" | "week" | "timeline";
type Audience = "intern" | "company";

type InterviewCalendarProps = {
  applications?: Application[] | CompanyApplication[];
  interviewRecords?: ScheduledInterviewRecord[];
  audience?: Audience;
};

const calendarSlideVariants = {
  enter: (dir: 1 | -1) => ({ opacity: 0, x: dir * 16 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: 1 | -1) => ({ opacity: 0, x: -dir * 16 })
};

const EMPTY_ENTRIES: CalendarDayEntry[] = [];
const EMPTY_EVENTS: ScheduledInterviewRecord[] = [];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

type EventAccent = { dot: string; chip: string; bar: string };

const STATUS_ACCENTS: Record<InterviewDisplayStatus, EventAccent> = {
  upcoming: {
    dot: "bg-sky-500",
    bar: "bg-sky-500",
    chip: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200"
  },
  scheduled: {
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    chip: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
  },
  in_progress: {
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    chip: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-200"
  },
  completed: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200"
  },
  cancelled: {
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
  }
};

function getInterviewIcon(item: ScheduledInterviewRecord): LucideIcon {
  const type = (item.interviewType || "").toLowerCase();
  if (type.includes("technical")) return Code2;
  if (type.includes("hr")) return Users;
  if (type.includes("final")) return Award;
  return item.mode === "offline" ? MapPin : Video;
}

function getAccent(item: ScheduledInterviewRecord): EventAccent {
  return STATUS_ACCENTS[item.interviewStatus] ?? STATUS_ACCENTS.scheduled;
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayLabelFromKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/* ---------- Event chip (month / week) ---------- */

const EventChip = memo(function EventChip({
  event,
  audience,
  onSelect
}: {
  event: ScheduledInterviewRecord;
  audience: Audience;
  onSelect: (event: ScheduledInterviewRecord) => void;
}) {
  const Icon = getInterviewIcon(event);
  const accent = getAccent(event);
  const label = getCalendarEventLabel(event, audience);
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      title={`${label} · ${formatInterviewDateTime(event.interviewDate, event.interviewTime)}`}
      aria-label={`${event.interviewType} with ${label} at ${formatInterviewTimeLabel(event.interviewTime)}, status ${event.interviewStatus}`}
      className={cn(
        "flex w-full items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[10px] font-medium transition duration-150 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        accent.chip
      )}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden />
      <span className="shrink-0 tabular-nums opacity-80">{formatInterviewTimeLabel(event.interviewTime)}</span>
      <span className="truncate">{label}</span>
    </button>
  );
});

/* ---------- Event card (timeline / week) ---------- */

function EventCard({
  event,
  audience,
  onSelect
}: {
  event: ScheduledInterviewRecord;
  audience: Audience;
  onSelect: (event: ScheduledInterviewRecord) => void;
}) {
  const Icon = getInterviewIcon(event);
  const accent = getAccent(event);
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="group flex w-full items-stretch gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-px hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-primary-800"
    >
      <span className={cn("w-1 shrink-0", accent.bar)} aria-hidden />
      <span className="flex min-w-0 flex-1 items-start gap-3 px-3 py-2.5">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
            accent.chip
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {getCalendarEventLabel(event, audience)}
            </span>
            <InterviewStatusChip status={event.interviewStatus} />
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">
            {event.role} · {event.interviewType}
          </span>
          <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
            {formatInterviewDateTime(event.interviewDate, event.interviewTime)}
          </span>
        </span>
      </span>
    </button>
  );
}

/* ---------- Month day cell ---------- */

const MonthDayCell = memo(function MonthDayCell({
  day,
  inMonth,
  isToday,
  isSelected,
  events,
  entries,
  audience,
  onOpenDay,
  onSelectEvent
}: {
  day: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: ScheduledInterviewRecord[];
  entries: CalendarDayEntry[];
  audience: Audience;
  onOpenDay: (dateKey: string) => void;
  onSelectEvent: (event: ScheduledInterviewRecord) => void;
}) {
  const dayKey = toLocalDateKey(day);
  const stickers = entries.filter((entry) => entry.entryType === "sticker").map((entry) => entry.emoji || "🙂");
  const noteCount = entries.filter((entry) => entry.entryType === "note").length;
  const hasPersonal = stickers.length > 0 || noteCount > 0;
  return (
    <div
      role="gridcell"
      className={cn(
        "group relative flex min-h-[104px] flex-col gap-1 border-b border-r border-slate-100 p-1.5 transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/40",
        !inMonth && "bg-slate-50/60 dark:bg-slate-950/40",
        isToday && "bg-primary-50/40 dark:bg-primary-950/30",
        isSelected && "ring-2 ring-inset ring-primary-400 dark:ring-primary-600"
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onOpenDay(dayKey)}
          aria-label={`${dayLabelFromKey(dayKey)}. ${events.length} interview${events.length === 1 ? "" : "s"}. Open day details.`}
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            isToday
              ? "bg-primary-600 text-white"
              : inMonth
                ? "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {day.getDate()}
        </button>
        <button
          type="button"
          onClick={() => onOpenDay(dayKey)}
          aria-label={`Add note or sticker for ${dayLabelFromKey(dayKey)}`}
          className="rounded-md p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {hasPersonal ? (
        <button
          type="button"
          onClick={() => onOpenDay(dayKey)}
          aria-label={`${stickers.length} sticker${stickers.length === 1 ? "" : "s"}, ${noteCount} note${noteCount === 1 ? "" : "s"}`}
          className="flex items-center gap-1 self-start rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] leading-none transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          {stickers.slice(0, 3).map((emoji, index) => (
            <span key={index} aria-hidden>
              {emoji}
            </span>
          ))}
          {noteCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
              <StickyNote className="h-2.5 w-2.5" aria-hidden />
              {noteCount}
            </span>
          ) : null}
        </button>
      ) : null}

      <div className="mt-auto space-y-1">
        {events.slice(0, 2).map((event) => (
          <EventChip key={event.interviewId} event={event} audience={audience} onSelect={onSelectEvent} />
        ))}
        {events.length > 2 ? (
          <button
            type="button"
            onClick={() => onOpenDay(dayKey)}
            className="w-full rounded px-1 text-left text-[10px] font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400"
          >
            +{events.length - 2} more
          </button>
        ) : null}
      </div>
    </div>
  );
});

/* ---------- Skeleton ---------- */

function CalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700" aria-hidden>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
        {WEEKDAYS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 42 }).map((_, index) => (
          <div key={index} className="min-h-[104px] border-b border-r border-slate-100 p-2 dark:border-slate-800">
            <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800" />
            <div className="mt-3 space-y-1">
              {index % 4 === 0 ? <div className="h-4 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : null}
              {index % 3 === 0 ? <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Main component ---------- */

export function InterviewCalendar({ applications = [], interviewRecords, audience = "intern" }: InterviewCalendarProps) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<ScheduledInterviewRecord | null>(null);
  const [dayModalKey, setDayModalKey] = useState<string | null>(null);
  const [personalEntries, setPersonalEntries] = useState<CalendarDayEntry[]>([]);
  const [entriesStatus, setEntriesStatus] = useState<"idle" | "loading" | "error">("idle");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const interviews = useMemo(
    () => interviewRecords ?? extractScheduledInterviews(applications),
    [applications, interviewRecords]
  );
  const grouped = useMemo(() => groupInterviewsByDate(interviews), [interviews]);
  const personalByDate = useMemo(() => groupCalendarEntriesByDate(personalEntries), [personalEntries]);

  const monthLabel = MONTHS[cursor.getMonth()];
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

  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    const cursorYear = cursor.getFullYear();
    const min = Math.min(current - 2, cursorYear);
    const max = Math.max(current + 3, cursorYear);
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }, [cursor]);

  const fetchRange = useMemo(() => {
    if (view === "week") return weekDateRange(weekStart);
    if (view === "month") return monthGridDateRange(cursor);
    return null;
  }, [view, cursor, weekStart]);

  useEffect(() => {
    if (!fetchRange) return;
    const { from, to } = fetchRange;
    let cancelled = false;
    setEntriesStatus("loading");

    fetchCalendarEntries(from, to)
      .then((entries) => {
        if (cancelled) return;
        setPersonalEntries((current) => {
          const outside = current.filter((entry) => entry.dateKey < from || entry.dateKey > to);
          return [...outside, ...entries];
        });
        setEntriesStatus("idle");
      })
      .catch(() => {
        if (cancelled) return;
        setEntriesStatus("error");
      })
      .finally(() => {
        if (!cancelled) setHasLoadedOnce(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchRange, reloadToken]);

  const eventsForDay = useCallback((day: Date) => grouped.get(toLocalDateKey(day)) || [], [grouped]);

  const updateDayEntries = useCallback((dateKey: string, nextEntries: CalendarDayEntry[]) => {
    setPersonalEntries((current) => {
      const withoutDay = current.filter((entry) => entry.dateKey !== dateKey);
      return [...withoutDay, ...nextEntries];
    });
  }, []);

const directionRef = useRef<1 | -1>(1);

  const goToday = useCallback(() => {
    setCursor((current) => {
      directionRef.current = new Date() >= current ? 1 : -1;
      return new Date();
    });
  }, []);
  const stepBackward = useCallback(() => {
    directionRef.current = -1;
    setCursor((current) => {
      const next = new Date(current);
      if (view === "month") next.setMonth(current.getMonth() - 1);
      else next.setDate(current.getDate() - 7);
      return next;
    });
  }, [view]);
  const stepForward = useCallback(() => {
    directionRef.current = 1;
    setCursor((current) => {
      const next = new Date(current);
      if (view === "month") next.setMonth(current.getMonth() + 1);
      else next.setDate(current.getDate() + 7);
      return next;
    });
  }, [view]);

  const selectEvent = useCallback((event: ScheduledInterviewRecord) => setSelected(event), []);
  const openDay = useCallback((dateKey: string) => setDayModalKey(dateKey), []);
  const retryEntries = useCallback(() => {
    setEntriesStatus("loading");
    setReloadToken((token) => token + 1);
  }, []);

  const subtitle =
    audience === "company"
      ? "Track interview schedules across month, week, and timeline views — annotate dates with notes and stickers."
      : "View your interview schedule and personalize any date with notes and stickers.";

  const showSkeleton = entriesStatus === "loading" && !hasLoadedOnce;
  const showError = entriesStatus === "error";
  const showNav = view !== "timeline";

  const dayEntries = dayModalKey ? personalByDate.get(dayModalKey) || [] : [];

  return (
    <>
      <SectionPanel title="Calendar" subtitle={subtitle} titleIcon={CalendarDays}>
        {/* Toolbar */}
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* View switcher */}
          <div
            className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-900/60 sm:w-auto"
            role="tablist"
            aria-label="Calendar view"
          >
            {([
              { mode: "month" as const, label: "Month", icon: CalendarDays },
              { mode: "week" as const, label: "Week", icon: CalendarRange },
              { mode: "timeline" as const, label: "Timeline", icon: List }
            ]).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={view === mode}
                onClick={() => setView(mode)}
                className={cn(
                  "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:flex-none",
                  view === mode
                    ? "text-white"
                    : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                {view === mode ? (
                  <motion.span
                    layoutId="calendar-view-pill"
                    className="absolute inset-0 rounded-lg bg-primary-600 shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <Icon className="relative h-3.5 w-3.5" aria-hidden />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {/* Date navigation */}
          {showNav ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={goToday}>
                Today
              </Button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={stepBackward}
                  aria-label={view === "month" ? "Previous month" : "Previous week"}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>

                {view === "month" ? (
                  <div className="flex items-center gap-1">
                    <label className="sr-only" htmlFor="calendar-month-select">
                      Month
                    </label>
                    <select
                      id="calendar-month-select"
                      value={cursor.getMonth()}
                      onChange={(event) => setCursor(new Date(cursor.getFullYear(), Number(event.target.value), 1))}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="calendar-year-select">
                      Year
                    </label>
                    <select
                      id="calendar-year-select"
                      value={cursor.getFullYear()}
                      onChange={(event) => setCursor(new Date(Number(event.target.value), cursor.getMonth(), 1))}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none transition focus:ring-2 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="min-w-[9.5rem] px-2 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {monthLabel} {cursor.getDate()}, {cursor.getFullYear()}
                  </span>
                )}

                <button
                  type="button"
                  onClick={stepForward}
                  aria-label={view === "month" ? "Next month" : "Next week"}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Error banner (non-blocking) */}
        {showError ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/60 dark:bg-rose-950/30">
            <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              <span>Couldn&apos;t load your notes &amp; stickers. Interviews are still shown.</span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={retryEntries}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </Button>
          </div>
        ) : null}

        {/* Month view */}
        {view === "month" ? (
          showSkeleton ? (
            <CalendarSkeleton />
          ) : (
            <AnimatePresence mode="popLayout" initial={false} custom={directionRef.current}>
              <motion.div
                key={`${cursor.getFullYear()}-${cursor.getMonth()}`}
                custom={directionRef.current}
                variants={calendarSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700"
                role="grid"
                aria-label={`${monthLabel} ${cursor.getFullYear()}`}
              >
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-700 dark:bg-slate-900/60">
                {WEEKDAYS.map((label) => (
                  <div key={label} role="columnheader" className="px-2 py-2">
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.charAt(0)}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {monthDays.map((day) => {
                  const dayKey = toLocalDateKey(day);
                  return (
                    <MonthDayCell
                      key={dayKey}
                      day={day}
                      inMonth={day.getMonth() === cursor.getMonth()}
                      isToday={isSameCalendarDay(day, new Date())}
                      isSelected={dayModalKey === dayKey}
                      events={grouped.get(dayKey) || EMPTY_EVENTS}
                      entries={personalByDate.get(dayKey) || EMPTY_ENTRIES}
                      audience={audience}
                      onOpenDay={openDay}
                      onSelectEvent={selectEvent}
                    />
                  );
                })}
              </div>
              </motion.div>
            </AnimatePresence>
          )
        ) : null}

        {/* Week view */}
        {view === "week" ? (
          showSkeleton ? (
            <CalendarSkeleton />
          ) : (
            <AnimatePresence mode="popLayout" initial={false} custom={directionRef.current}>
              <motion.div
                key={toLocalDateKey(weekStart)}
                custom={directionRef.current}
                variants={calendarSlideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7"
              >
              {weekDays.map((day) => {
                const dayKey = toLocalDateKey(day);
                const events = eventsForDay(day);
                const dayEntriesList = personalByDate.get(dayKey) || [];
                const stickers = dayEntriesList.filter((entry) => entry.entryType === "sticker");
                const noteCount = dayEntriesList.filter((entry) => entry.entryType === "note").length;
                const isToday = isSameCalendarDay(day, new Date());
                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "flex flex-col rounded-2xl border border-slate-200 p-3 transition-colors duration-150 dark:border-slate-700",
                      isToday && "border-primary-300 bg-primary-50/40 dark:border-primary-800 dark:bg-primary-950/20"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => openDay(dayKey)}
                      className="flex items-center justify-between rounded-lg text-left transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      aria-label={`Open ${dayLabelFromKey(dayKey)}`}
                    >
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                          {day.toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span className={cn("mt-0.5 block text-lg font-bold", isToday ? "text-primary-700 dark:text-primary-300" : "text-slate-900 dark:text-slate-100")}>
                          {day.getDate()}
                        </span>
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        {stickers.slice(0, 3).map((sticker, index) => (
                          <span key={index} aria-hidden>
                            {sticker.emoji || "🙂"}
                          </span>
                        ))}
                        {noteCount > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                            <StickyNote className="h-3 w-3" aria-hidden />
                            {noteCount}
                          </span>
                        ) : null}
                      </span>
                    </button>

                    <div className="mt-3 space-y-2">
                      {events.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-slate-200 px-2 py-3 text-center text-[11px] text-slate-400 dark:border-slate-700">
                          No interviews
                        </p>
                      ) : (
                        events.map((event) => (
                          <EventCard key={event.interviewId} event={event} audience={audience} onSelect={selectEvent} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
              </motion.div>
            </AnimatePresence>
          )
        ) : null}

        {/* Timeline view */}
        {view === "timeline" ? (
          interviews.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-slate-700">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CalendarX2 className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No events scheduled</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {audience === "company"
                    ? "Interviews you schedule will appear here as a chronological timeline."
                    : "Your upcoming interviews will appear here once they're scheduled."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {interviews.map((event) => (
                <EventCard key={event.interviewId} event={event} audience={audience} onSelect={selectEvent} />
              ))}
            </div>
          )
        ) : null}
      </SectionPanel>

      <InterviewDetailsModal
        open={Boolean(selected)}
        interview={selected}
        audience={audience}
        onClose={() => setSelected(null)}
      />

      <CalendarDayDetailModal
        open={Boolean(dayModalKey)}
        dateKey={dayModalKey}
        dateLabel={dayModalKey ? dayLabelFromKey(dayModalKey) : ""}
        entries={dayEntries}
        onClose={() => setDayModalKey(null)}
        onEntriesChange={(next) => {
          if (dayModalKey) updateDayEntries(dayModalKey, next);
        }}
      />
    </>
  );
}
