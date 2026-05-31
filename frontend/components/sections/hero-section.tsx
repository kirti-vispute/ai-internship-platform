"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-16 pt-16 sm:pb-20 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.14),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(15,23,42,0.34)_48%,rgba(2,6,23,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-slate-950/55 to-slate-950" />

      <div className="container-shell relative z-20 grid min-h-[620px] items-start gap-8 py-2 sm:py-4 lg:grid-cols-[1fr_1.08fr] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 max-w-2xl"
        >
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-slate-900/75 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            AI Internship Workflow Map
          </p>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            From resume upload to verified hiring, in one intelligent flow.
          </h1>

          <p className="mt-4 max-w-xl text-base text-slate-200 sm:text-lg">
            InternAI maps every step: resume analysis, score generation, skill-gap detection, trusted company matching, and
            pipeline progression with premium visibility for interns and recruiters.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" href="/auth/intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth/company">
              Join as Company
            </Button>
            <Button size="lg" variant="secondary" href="/auth/admin">
              Admin Console
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200">Resume upload intelligence</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200">Skill gap detection</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200">Verified hiring progress</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="relative h-full min-h-[460px] w-full overflow-hidden sm:min-h-[540px] lg:min-h-[620px]"
        >
          <div className="relative m-0 h-full w-full overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6">
            <div className="grid h-full gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Resume Intelligence</p>
                <p className="mt-2 text-2xl font-black text-white">Score + ATS Readiness</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Skill Gap</p>
                  <p className="mt-2 text-lg font-bold text-white">Targeted learning paths</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Matching</p>
                  <p className="mt-2 text-lg font-bold text-white">Verified company fit</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-300">Pipeline visibility from application to offer with explainable AI scores.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
