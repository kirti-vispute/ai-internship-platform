"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { InternShell } from "@/components/dashboard/intern-shell";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { clearAuthSession } from "@/lib/session";
import { Application, fetchInternApplications } from "@/lib/intern-portal";

export default function HrFeedbackPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setApplications(await fetchInternApplications());
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
      <InternShell welcomeName="Intern" onLogout={handleLogout}>
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading HR feedback...</div>
        ) : (
          <SectionPanel title="HR Feedback" subtitle="Direct recruiter feedback from your applications.">
            {error && <p className="text-sm text-rose-700">{error}</p>}
            {!error && feedbackItems.length === 0 && <p className="text-sm text-slate-600">No HR feedback yet.</p>}
            {!error && feedbackItems.length > 0 && (
              <div className="space-y-2">
                {feedbackItems.map((item, idx) => (
                  <p key={`${item.internship}-${idx}`} className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {item.internship}: {item.feedback}
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

