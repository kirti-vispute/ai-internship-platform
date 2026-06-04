"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { clearAuthSession } from "@/lib/session";
import { Application, InternProfile, fetchInternApplications, fetchInternProfile } from "@/lib/intern-portal";

export default function HrFeedbackPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [loadedProfile, loadedApplications] = await Promise.all([fetchInternProfile(), fetchInternApplications(true)]);
        setProfile(loadedProfile);
        setApplications(loadedApplications);
      } catch (err) {
        setError((err as Error).message || "Failed to load HR feedback.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const feedbackItems = useMemo(
    () =>
      applications.flatMap((app) =>
        (app.hrFeedback || []).map((item) => ({
          internship: app.internship?.role || "Internship",
          company: app.internship?.company?.companyName || "Company",
          status: app.status,
          feedback: item.feedback,
          rating: item.rating,
          category: item.category,
          createdAt: item.createdAt
        }))
      ),
    [applications]
  );

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/intern");
  };

  return (
    <RoleDashboardGuard expectedRole="intern">
      <InternShell welcomeName={profile?.fullName} onLogout={handleLogout}>
        <div className="dashboard-stack">
          <DashboardPageHeader
            eyebrow="Feedback"
            title="HR Feedback"
            subtitle="Recruiter feedback, ratings, and improvement notes on your applications."
          />
          {loading ? (
            <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading HR feedback...</div>
          ) : (
            <SectionPanel title="Feedback History" subtitle="Only candidate-visible feedback is shown here.">
              {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
              {!error && feedbackItems.length === 0 && (
                <EmptyState title="No HR feedback yet" hint="Feedback appears after recruiters review your applications." presetKey="feedback" />
              )}
              {!error && feedbackItems.length > 0 && (
                <div className="space-y-3">
                  {feedbackItems.map((item, idx) => (
                    <div key={`${item.internship}-${idx}`} className="surface-subtle px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {item.internship} · {item.company}
                        </p>
                        {item.rating && (
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                            {item.rating}/5
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.feedback}</p>
                      <p className="mt-2 text-xs text-slate-500 capitalize">
                        {item.category || "general"} · {item.status.replace(/_/g, " ")}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionPanel>
          )}
        </div>
      </InternShell>
    </RoleDashboardGuard>
  );
}
