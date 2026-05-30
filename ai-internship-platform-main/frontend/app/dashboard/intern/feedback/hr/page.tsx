"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
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
        const [loadedProfile, loadedApplications] = await Promise.all([fetchInternProfile(), fetchInternApplications()]);
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
          feedback: item.feedback
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
        {loading ? (
          <div className="surface-muted p-5 text-sm text-slate-700 dark:text-slate-300">Loading HR feedback...</div>
        ) : (
          <SectionPanel title="HR Feedback" subtitle="Direct recruiter feedback from your applications.">
            {error && <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
            {!error && feedbackItems.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">No HR feedback yet.</p>}
            {!error && feedbackItems.length > 0 && (
              <div className="space-y-2">
                {feedbackItems.map((item, idx) => (
                  <p key={`${item.internship}-${idx}`} className="surface-subtle px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">{item.internship}:</span> {item.feedback}
                  </p>
                ))}
              </div>
            )}
          </SectionPanel>
        )}
      </InternShell>
    </RoleDashboardGuard>
  );
}
