"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { RoleDashboardGuard } from "@/components/ui/role-dashboard-guard";
import { Card } from "@/components/ui/card";
import { clearAuthSession } from "@/lib/session";

const hiringPipeline = [
  { stage: "New Applicants", count: 48 },
  { stage: "Shortlisted", count: 17 },
  { stage: "Interviewing", count: 9 },
  { stage: "Offered", count: 4 }
];

const matchedCandidates = [
  { name: "Aarav Sharma", score: "96%" },
  { name: "Isha Mehta", score: "93%" },
  { name: "Rohan Nair", score: "91%" }
];

export default function CompanyDashboardPage() {
  const router = useRouter();

  function handleLogout() {
    clearAuthSession();
    router.push("/auth?role=company");
  }

  return (
    <main>
      <Navbar />
      <RoleDashboardGuard expectedRole="company">
        <section className="container-shell py-10 sm:py-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Company Dashboard</p>
              <h1 className="text-3xl font-black tracking-tight text-ink dark:text-slate-100 sm:text-4xl">Manage your hiring pipeline</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/auth?role=company" className="rounded-full bg-white px-3 py-1 text-sm font-medium text-primary-600 shadow-soft hover:text-primary-700 dark:bg-slate-900 dark:text-primary-300 dark:hover:text-primary-200">
                Switch account
              </Link>
              <Button type="button" variant="secondary" size="sm" onClick={handleLogout}>
                LogOut
              </Button>
            </div>
          </div>

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <Card className="border-none bg-white dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Verification Status</p>
              <p className="mt-2 text-2xl font-black text-ink dark:text-slate-100">Verified</p>
              <p className="mt-2 text-xs text-emerald-600">Company profile approved</p>
            </Card>
            <Card className="border-none bg-white dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Active Internship Posts</p>
              <p className="mt-2 text-2xl font-black text-ink dark:text-slate-100">6</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-primary-500 to-blue-500" />
              </div>
            </Card>
            <Card className="border-none bg-white dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Applicants This Week</p>
              <p className="mt-2 text-2xl font-black text-ink dark:text-slate-100">132</p>
              <p className="mt-2 text-xs text-primary-600">+14% vs last week</p>
            </Card>
          </div>

          <div className="mb-4 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white shadow-glow">
            <p className="text-sm font-semibold">Quick Actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Post New Internship</button>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">View Shortlisted</button>
              <button className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30">Export Candidate List</button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card title="Candidate Tracking" subtitle="Hiring pipeline overview">
                <div className="grid gap-3 sm:grid-cols-2">
                  {hiringPipeline.map((item) => (
                    <div key={item.stage} className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.stage}</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{item.count}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Post Internship" subtitle="Manage your current openings">
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">AI Product Intern - Applications Open</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">ML Operations Intern - Draft Mode</p>
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/70">Data Analyst Intern - Closing in 3 days</p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="AI Matched Candidates" subtitle="Top profile recommendations">
                <div className="space-y-2">
                  {matchedCandidates.map((candidate) => (
                    <div key={candidate.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-3 py-2 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{candidate.name}</p>
                      <p className="rounded-full bg-primary-50 px-2 py-1 text-sm font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">{candidate.score}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Applicants" subtitle="Latest applicant activity">
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  18 new applicants in the last 24 hours across active openings.
                </p>
              </Card>

              <Card title="Feedback" subtitle="Hiring cycle notes">
                <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-300">
                  Candidate quality is high. Consider increasing slots for data-focused roles.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </RoleDashboardGuard>
      <Footer />
    </main>
  );
}
