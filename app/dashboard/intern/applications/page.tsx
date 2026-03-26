"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { apiRequest } from "@/lib/api-client";

type Application = {
  _id: string;
  status: string;
  matchScore: number;
  internship: {
    role: string;
    company?: { companyName?: string };
    location?: string;
  };
  stageHistory: Array<{ stage: string; note: string; changedAt: string }>;
  hrFeedback: Array<{ feedback: string; createdAt: string }>;
};

export default function InternApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        setLoading(true);
        setError(null);
        const response = await apiRequest<{ applications: Application[] }>("/api/intern/applications");
        setApplications(response.applications || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  const progressSummary = useMemo(() => {
    const grouped = applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    return grouped;
  }, [applications]);

  return (
    <main>
      <Navbar />
      <RoleDashboardGuard expectedRole="intern">
        <section className="container-shell py-10 sm:py-14">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Intern Dashboard</p>
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">My Applications</h1>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => router.push("/dashboard/intern")}>
              Back to Dashboard
            </Button>
          </div>

          {loading && (
            <Card>
              <p className="text-sm text-slate-600">Loading applications...</p>
            </Card>
          )}

          {error && (
            <Card className="border-rose-200 bg-rose-50">
              <p className="text-sm text-rose-700">{error}</p>
            </Card>
          )}

          {!loading && !error && applications.length === 0 && (
            <Card>
              <p className="text-sm text-slate-600">No applications found yet.</p>
            </Card>
          )}

          {!loading && !error && applications.length > 0 && (
            <>
              <Card title="Progress Summary" subtitle="Live stage/status distribution from backend">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {Object.entries(progressSummary).map(([status, count]) => (
                    <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                      <p className="font-semibold capitalize text-slate-900">{status}</p>
                      <p className="text-slate-600">{count}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="mt-4 space-y-3">
                {applications.map((app) => (
                  <Card key={app._id} title={app.internship?.role || "Internship"} subtitle={app.internship?.company?.companyName || "Company"}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">Current Status</p>
                        <p className="text-sm font-semibold capitalize text-slate-900">{app.status}</p>
                        <p className="mt-2 text-xs text-slate-500">Match Score: {app.matchScore || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500">Stage Timeline</p>
                        <ul className="mt-1 space-y-1 text-xs text-slate-700">
                          {(app.stageHistory || []).length === 0 && <li>No stage movement yet.</li>}
                          {(app.stageHistory || []).map((stage, idx) => (
                            <li key={`${stage.stage}-${idx}`} className="rounded bg-slate-50 px-2 py-1">
                              <span className="font-semibold capitalize">{stage.stage}</span>
                              {stage.note ? ` - ${stage.note}` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500">HR Feedback</p>
                      {(app.hrFeedback || []).length === 0 ? (
                        <p className="text-sm text-slate-600">No HR feedback yet.</p>
                      ) : (
                        <div className="mt-1 space-y-1">
                          {(app.hrFeedback || []).map((item, idx) => (
                            <p key={`${app._id}-feedback-${idx}`} className="rounded border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                              {item.feedback}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </section>
      </RoleDashboardGuard>
      <Footer />
    </main>
  );
}
