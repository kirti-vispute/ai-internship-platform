import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-visible bg-hero pb-16 pt-20 sm:pb-24 sm:pt-24">
      <div className="container-shell grid min-h-[calc(100svh-4rem)] items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-reveal">
          <p className="inline-flex rounded-full border border-primary-200 bg-white/95 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            AI Internship Platform
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Find high-fit internships and hire top talent, faster.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-700 sm:text-lg">
            InternAI combines AI-powered matching, skill-gap intelligence, and verified company onboarding to help interns
            grow with clarity and help teams hire with confidence.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" href="/auth?role=intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth?role=company">
              Join as Company
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-slate-700 shadow-sm">AI internship matching</span>
            <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-slate-700 shadow-sm">Skill gap insights</span>
            <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-slate-700 shadow-sm">Verified company network</span>
          </div>
        </div>

        <div className="grid-pattern animate-reveal rounded-3xl border border-white/60 bg-white/78 p-6 backdrop-blur shadow-[0_14px_34px_rgba(15,23,42,0.12)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-700">Platform Journey</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
              <p className="text-sm font-semibold text-slate-900">Create trusted profiles</p>
              <p className="mt-1 text-sm text-slate-700">Verification-first onboarding for interns and companies.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/95 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
              <p className="text-sm font-semibold text-slate-900">Activate AI recommendations</p>
              <p className="mt-1 text-sm text-slate-700">Ranked matches based on skills, profile signals, and role fit.</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-4 shadow-[0_8px_20px_rgba(37,99,235,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(37,99,235,0.18)]">
              <p className="text-sm font-semibold text-slate-900">Run progress from one dashboard</p>
              <p className="mt-1 text-sm text-slate-700">Track applications, skill growth, and hiring pipeline in real time.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
