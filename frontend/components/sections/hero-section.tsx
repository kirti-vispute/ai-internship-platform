"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";

const ThreeHero = dynamic(() => import("@/components/ThreeHero").then((mod) => mod.ThreeHero), {
  ssr: false,
  loading: () => null
});

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-20 pt-24 sm:pb-24 sm:pt-28">
      <ThreeHero />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_84%_12%,rgba(59,130,246,0.18),transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96)_0%,rgba(15,23,42,0.94)_50%,rgba(2,6,23,0.98)_100%)]" />

      <div className="container-shell relative grid min-h-[calc(100svh-4rem)] items-center gap-10 lg:grid-cols-[1.06fr_1fr]">
        <div className="animate-reveal [animation-delay:80ms]">
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-slate-900/75 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200 shadow-[0_10px_28px_rgba(6,182,212,0.2)]">
            Verified AI Internship Network
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Match the right intern to the right role with AI precision.
          </h1>

          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            InternAI unifies resume scoring, skill-gap intelligence, verified company discovery, and role-based dashboards
            so students grow faster and hiring teams close internship roles with confidence.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" href="/auth?role=intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth?role=company">
              Join as Company
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Resume score signals
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Skill gap coaching
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Hiring pipeline tracking
            </span>
          </div>
        </div>

        <div className="relative animate-reveal [animation-delay:180ms]">
          <div className="pointer-events-none absolute -top-5 right-8 h-24 w-24 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-8 left-10 h-20 w-20 rounded-full bg-indigo-400/20 blur-3xl" />
          <div data-cursor="card" className="tilt-3d animate-float-gentle grid-pattern rounded-3xl border border-slate-700/80 bg-slate-900/78 p-6 backdrop-blur-xl shadow-[0_24px_60px_rgba(2,6,23,0.62)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">AI Internship Command Center</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-700 bg-slate-900/92 p-4 shadow-[0_12px_26px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(2,6,23,0.62)]">
                <p className="text-sm font-semibold text-slate-100">Resume Score + ATS Readiness</p>
                <p className="mt-1 text-sm text-slate-300">Instantly benchmark candidate quality and interview readiness from uploaded resumes.</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/92 p-4 shadow-[0_12px_26px_rgba(2,6,23,0.45)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(2,6,23,0.62)]">
                <p className="text-sm font-semibold text-slate-100">Skill Gap + Learning Paths</p>
                <p className="mt-1 text-sm text-slate-300">Highlight missing skills and route interns to focused learning before applications.</p>
              </div>
              <div className="rounded-xl border border-cyan-400/35 bg-cyan-500/10 p-4 shadow-[0_12px_30px_rgba(8,145,178,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(14,165,233,0.35)]">
                <p className="text-sm font-semibold text-slate-100">Verified Hiring Workflow</p>
                <p className="mt-1 text-sm text-slate-300">Track applicants from applied to selected with transparent company-side stages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
