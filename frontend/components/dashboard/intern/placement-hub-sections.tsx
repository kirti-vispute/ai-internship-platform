"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Award, BadgeCheck, BookOpen, Clock3, Flame, GraduationCap, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { AppIcon } from "@/components/icons/app-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/dashboard/shared/empty-state";
import { TrendAreaChart } from "@/components/dashboard/charts/analytics-charts";
import { cn } from "@/lib/utils";
import type { Application, ResumeAnalysis } from "@/lib/intern-portal";
import type { ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { getAptitudeHistory, buildProgressData } from "@/lib/aptitude-progress";
import {
  certificationStatusLabel,
  fetchMyCertifications,
  type CertificationRecord,
  type CertificationStats
} from "@/lib/certifications-portal";

const cardBase = "rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-[0_1px_2px_var(--ds-shadow)]";

/* ============================== Weekly Streak ============================== */

/** Consecutive-day activity streak derived from existing application/interview timestamps -- no new tracking, purely a client-side read of dates already on hand. */
function computeActivityStreak(applications: Application[], interviewRecords: ScheduledInterviewRecord[]): { streak: number; activeDays: Set<string> } {
  const activeDays = new Set<string>();
  applications.forEach((app) => {
    if (app.appliedAt) activeDays.add(new Date(app.appliedAt).toISOString().slice(0, 10));
  });
  interviewRecords.forEach((interview) => {
    if (interview.interviewDate) activeDays.add(new Date(interview.interviewDate).toISOString().slice(0, 10));
  });

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Today counting only if there's already activity today; otherwise start from yesterday so a quiet morning doesn't zero out an existing streak.
  if (!activeDays.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak, activeDays };
}

export function WeeklyStreakBanner({
  applications,
  interviewRecords
}: {
  applications: Application[];
  interviewRecords: ScheduledInterviewRecord[];
}) {
  const { streak, activeDays } = useMemo(
    () => computeActivityStreak(applications, interviewRecords),
    [applications, interviewRecords]
  );

  const last7 = useMemo(() => {
    const days: { key: string; label: string; active: boolean }[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - 6);
    for (let i = 0; i < 7; i += 1) {
      const key = cursor.toISOString().slice(0, 10);
      days.push({ key, label: cursor.toLocaleDateString(undefined, { weekday: "narrow" }), active: activeDays.has(key) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [activeDays]);

  return (
    <ScrollReveal variant="fade-up" distance={10}>
      <div className={cn(cardBase, "flex flex-wrap items-center justify-between gap-4 p-5")}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--ds-warning)]/15 text-[var(--ds-warning)]">
            <AppIcon icon={Flame} size="md" className="text-current" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-muted)]">Weekly Streak</p>
            <p className="text-lg font-bold tabular-nums text-[var(--ds-text)]">
              {streak} day{streak === 1 ? "" : "s"} <span className="text-xs font-medium text-[var(--ds-muted)]">of prep activity</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {last7.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
                  day.active ? "bg-[var(--ds-warning)] text-[var(--ds-on-warning)]" : "bg-[var(--ds-surface-raised)] text-[var(--ds-muted)]"
                )}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}

/* ============================== Recommended Learning ============================== */

export function RecommendedLearningSection({ analysis, loading }: { analysis: ResumeAnalysis | null | undefined; loading?: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const items = analysis?.skillIntelligence?.learningRecommendations || [];

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={BookOpen} size="sm" className="text-[var(--ds-accent)]" />
          <h3 className="text-sm font-semibold text-[var(--ds-text)]">Recommended Learning</h3>
        </div>
        {items.length === 0 ? (
          <EmptyState title="No recommendations yet" hint="Upload a resume so AI can recommend learning paths." icon={BookOpen} />
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 5).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="flex items-start gap-3 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-4 py-3 text-sm"
              >
                <AppIcon icon={Sparkles} size="xs" className="mt-0.5 shrink-0 text-[var(--ds-accent)]" />
                <span className="text-[var(--ds-text)]">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScrollReveal>
  );
}

/* ============================== Upcoming Deadlines ============================== */

type DeadlineItem = { id: string; label: string; detail: string; date: Date; kind: "interview" | "joining" };

function buildDeadlines(applications: Application[], interviewRecords: ScheduledInterviewRecord[]): DeadlineItem[] {
  const now = Date.now();
  const horizon = now + 14 * 24 * 60 * 60 * 1000;
  const items: DeadlineItem[] = [];

  interviewRecords.forEach((interview) => {
    if (!interview.interviewDate) return;
    const date = new Date(interview.interviewDate);
    const time = date.getTime();
    if (Number.isNaN(time) || time < now || time > horizon) return;
    items.push({
      id: `interview-${interview.interviewId}`,
      label: `Interview: ${interview.role}`,
      detail: interview.companyName,
      date,
      kind: "interview"
    });
  });

  applications.forEach((app) => {
    if (!app.joiningDate) return;
    const date = new Date(app.joiningDate);
    const time = date.getTime();
    if (Number.isNaN(time) || time < now || time > horizon) return;
    items.push({
      id: `joining-${app._id}`,
      label: `Joining date: ${app.internship?.role || "Internship"}`,
      detail: app.internship?.company?.companyName || "Company",
      date,
      kind: "joining"
    });
  });

  return items.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);
}

export function UpcomingDeadlinesSection({
  applications,
  interviewRecords
}: {
  applications: Application[];
  interviewRecords: ScheduledInterviewRecord[];
}) {
  const items = useMemo(() => buildDeadlines(applications, interviewRecords), [applications, interviewRecords]);

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Clock3} size="sm" className="text-[var(--ds-warning)]" />
          <h3 className="text-sm font-semibold text-[var(--ds-text)]">Upcoming Deadlines</h3>
        </div>
        {items.length === 0 ? (
          <EmptyState title="Nothing due soon" hint="Interview dates and joining deadlines in the next 14 days will appear here." icon={Clock3} />
        ) : (
          <ul className="space-y-2.5">
            {items.map((item) => {
              const daysLeft = Math.max(0, Math.ceil((item.date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ds-text)]">{item.label}</p>
                    <p className="truncate text-xs text-[var(--ds-muted)]">{item.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--ds-warning)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--ds-warning)]">
                    {daysLeft === 0 ? "Today" : `${daysLeft}d left`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ScrollReveal>
  );
}

/* ============================== Mock Test Progress ============================== */

export function MockTestProgressSection() {
  const [points, setPoints] = useState<ReturnType<typeof buildProgressData>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPoints(buildProgressData(getAptitudeHistory()));
    setReady(true);
  }, []);

  const trend = useMemo(
    () => points.map((point, idx) => ({ label: `Test ${point.test ?? idx + 1}`, value: Math.round(point.readiness) })),
    [points]
  );
  const latest = points[points.length - 1];

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-4 flex items-center gap-2">
          <AppIcon icon={Award} size="sm" className="text-[var(--ds-primary-text)]" />
          <h3 className="text-sm font-semibold text-[var(--ds-text)]">Mock Test Progress</h3>
        </div>

        {!ready ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {trend.length === 0 ? (
                <EmptyState
                  title="No aptitude attempts yet"
                  hint="Take a mock aptitude test to start tracking readiness over time."
                  action={
                    <Button href="/dashboard/intern/learning/mock-aptitude" type="button" size="sm">
                      Take Mock Aptitude Test
                    </Button>
                  }
                />
              ) : (
                <>
                  <TrendAreaChart data={trend} valueLabel="readiness score" />
                  {latest ? (
                    <p className="mt-2 text-xs text-[var(--ds-muted)]">
                      Latest accuracy <span className="font-semibold text-[var(--ds-text)]">{Math.round(latest.accuracy)}%</span> &middot; score{" "}
                      <span className="font-semibold text-[var(--ds-text)]">
                        {latest.score}/{latest.maxScore}
                      </span>
                    </p>
                  ) : null}
                </>
              )}
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-muted)]">Mock Technical Test</p>
                <p className="mt-1 text-xs text-[var(--ds-muted)]">Coming soon</p>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--ds-border)] bg-[var(--ds-surface-raised)] p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-muted)]">Mock Interview</p>
                <p className="mt-1 text-xs text-[var(--ds-muted)]">Coming soon</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollReveal>
  );
}

/* ============================== Certificates ============================== */

const CERT_STATUS_TONE: Record<string, string> = {
  verified: "bg-[var(--ds-success)]/10 text-[var(--ds-success)]",
  pending_verification: "bg-[var(--ds-warning)]/10 text-[var(--ds-warning)]",
  rejected: "bg-[var(--ds-danger)]/10 text-[var(--ds-danger)]"
};

export function CertificatesSection() {
  const [certifications, setCertifications] = useState<CertificationRecord[]>([]);
  const [stats, setStats] = useState<CertificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyCertifications()
      .then((data) => {
        if (cancelled) return;
        setCertifications(data.certifications || []);
        setStats(data.stats || null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ScrollReveal variant="fade-up" distance={12}>
      <div className={cn(cardBase, "p-6")}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppIcon icon={GraduationCap} size="sm" className="text-[var(--ds-success)]" />
            <h3 className="text-sm font-semibold text-[var(--ds-text)]">Certificates</h3>
          </div>
          <Button href="/dashboard/intern/learning/certifications" type="button" size="sm" variant="ghost">
            Manage
          </Button>
        </div>

        {loading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : certifications.length === 0 ? (
          <EmptyState
            title="No certificates yet"
            hint="Add a certification to strengthen your placement readiness."
            action={
              <Button href="/dashboard/intern/learning/certifications" type="button" size="sm">
                Add Certificate
              </Button>
            }
          />
        ) : (
          <>
            {stats ? (
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-3 py-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-[var(--ds-text)]">{stats.total}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ds-muted)]">Total</p>
                </div>
                <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-3 py-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-[var(--ds-success)]">{stats.verified}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ds-muted)]">Verified</p>
                </div>
                <div className="rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-3 py-2.5 text-center">
                  <p className="text-lg font-bold tabular-nums text-[var(--ds-warning)]">{stats.pending}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ds-muted)]">Pending</p>
                </div>
              </div>
            ) : null}
            <ul className="space-y-2">
              {certifications.slice(0, 4).map((cert) => (
                <li
                  key={cert._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] px-4 py-3"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <AppIcon icon={BadgeCheck} size="xs" className="shrink-0 text-[var(--ds-accent)]" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ds-text)]">{cert.courseName}</p>
                      <p className="truncate text-xs text-[var(--ds-muted)]">{cert.provider}</p>
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold", CERT_STATUS_TONE[cert.verificationStatus])}>
                    {certificationStatusLabel(cert.verificationStatus)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </ScrollReveal>
  );
}
