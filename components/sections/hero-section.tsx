import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="bg-hero pb-16 pt-20 sm:pb-24 sm:pt-28">
      <div className="container-shell grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <p className="inline-flex rounded-full border border-primary-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
            AI Internship Platform
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Start stronger careers and smarter hiring journeys.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            InternAI connects interns and companies with a clean workflow powered by AI-guided matching, skill insights,
            and role-specific dashboards.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" href="/auth?role=intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth?role=company">
              Join as Company
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">AI matching engine</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Role-based dashboards</span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Verification-first onboarding</span>
          </div>
        </div>

        <div className="section-glass grid-pattern rounded-3xl p-6 shadow-soft animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Platform Journey</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">Create verified role profiles</p>
              <p className="mt-1 text-sm text-slate-600">Intern and company onboarding with guided validation.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">Use AI recommendations</p>
              <p className="mt-1 text-sm text-slate-600">Get match-quality insights for internships and candidates.</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Track everything in dashboards</p>
              <p className="mt-1 text-sm text-slate-600">Applications, skill gaps, hiring funnel, and verification status.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
