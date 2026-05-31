"use client";

import { useEffect, useMemo, useState } from "react";
import { SectionPanel } from "@/components/dashboard/section-panel";
import { Application, InternProfile, fetchInternApplications, fetchInternProfile, peekInternProfile } from "@/lib/intern-portal";

export default function HrFeedbackPage() {
  const [profile, setProfile] = useState<InternProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(() => typeof window === "undefined" ? true : !peekInternProfile());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!peekInternProfile()) setLoading(true);
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

  return (
    <>
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
    </>
  );
}
