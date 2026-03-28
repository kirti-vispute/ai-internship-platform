"use client";

import dynamic from "next/dynamic";
import { SectionAnimator } from "@/components/home/SectionAnimator";
import { Button } from "@/components/ui/button";

const InteractiveHeroScene = dynamic(() => import("@/components/home/InteractiveHeroScene").then((mod) => mod.InteractiveHeroScene), {
  ssr: false,
  loading: () => null
});

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-20 pt-24 sm:pb-24 sm:pt-28">
      <div className="relative min-h-[730px]">
        <InteractiveHeroScene />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_88%_16%,rgba(59,130,246,0.16),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.24)_0%,rgba(15,23,42,0.34)_52%,rgba(2,6,23,0.56)_100%)]" />

        <div className="container-shell relative z-20 flex min-h-[730px] items-center py-8">
          <SectionAnimator revealVariant="blur-up" delayMs={80} distance={20} parallax={18} className="z-20 max-w-2xl">
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
          </SectionAnimator>
        </div>
      </div>
    </section>
  );
}
