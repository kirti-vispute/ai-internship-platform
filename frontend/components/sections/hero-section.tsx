"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HeroScene = dynamic(() => import("@/components/home/HeroScene").then((mod) => mod.HeroScene), {
  ssr: false,
  loading: () => null
});

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.14),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(15,23,42,0.3)_52%,rgba(2,6,23,0.5)_100%)]" />

      <div className="container-shell relative z-20 grid min-h-[700px] items-center gap-8 py-6 lg:grid-cols-[1fr_1.02fr] lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 max-w-2xl"
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.97 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="relative h-[440px] overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-950/75 shadow-[0_30px_70px_rgba(2,6,23,0.6)] sm:h-[500px] lg:h-[560px]"
        >
          <HeroScene />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(125,211,252,0.16),transparent_35%),radial-gradient(circle_at_78%_86%,rgba(129,140,248,0.14),transparent_36%)]" />
        </motion.div>
      </div>
    </section>
  );
}

