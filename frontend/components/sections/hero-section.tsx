import { Button } from "@/components/ui/button";
import { HeroThreeBackground } from "@/components/visuals/hero-three-background";

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-20 pt-24 sm:pb-24 sm:pt-28">
      <HeroThreeBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.2),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.2),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.94),rgba(15,23,42,0.92)_55%,rgba(2,6,23,0.98))]" />

      <div className="container-shell relative grid min-h-[calc(100svh-4rem)] items-center gap-10 lg:grid-cols-[1.08fr_1fr]">
        <div className="animate-reveal">
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-slate-900/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200 shadow-[0_8px_24px_rgba(14,165,233,0.18)]">
            AI Internship Platform
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            AI-powered internship matching for faster careers and smarter hiring.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            InternAI connects ambitious students and verified companies with role-fit intelligence, resume insights, and
            structured hiring pipelines that speed up outcomes.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" href="/auth?role=intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth?role=company">
              Join as Company
            </Button>
          </div>

          <p className="mt-4 text-sm text-slate-300">
            Build skills with precision. Hire with confidence. Track growth from first application to offer.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              AI internship matching
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Skill gap insights
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Verified companies
            </span>
          </div>
        </div>

        <div className="grid-pattern animate-reveal rounded-3xl border border-slate-700/80 bg-slate-900/78 p-6 backdrop-blur-xl shadow-[0_24px_60px_rgba(2,6,23,0.6)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Platform Journey</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-[0_12px_26px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(2,6,23,0.62)]">
              <p className="text-sm font-semibold text-slate-100">Verified onboarding</p>
              <p className="mt-1 text-sm text-slate-300">Trust-first onboarding for interns and companies with review states.</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-[0_12px_26px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(2,6,23,0.62)]">
              <p className="text-sm font-semibold text-slate-100">AI ranked matching</p>
              <p className="mt-1 text-sm text-slate-300">Recommendations prioritize skills, resume strength, and internship fit.</p>
            </div>
            <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4 shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(14,165,233,0.35)]">
              <p className="text-sm font-semibold text-slate-100">Unified growth dashboard</p>
              <p className="mt-1 text-sm text-slate-300">Track score, skill growth, applications, and hiring progress in one place.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
