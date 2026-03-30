"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HERO_REFERENCE_IMAGE = "https://tse3.mm.bing.net/th/id/OIP.bFDy8g5Icz41BvWQ3_Y4dAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3";

export function HeroSection() {
  return (
    <section className="relative z-0 overflow-hidden bg-slate-950 pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.14),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(15,23,42,0.34)_48%,rgba(2,6,23,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-slate-950/55 to-slate-950" />

      <div className="container-shell relative z-20 grid min-h-[700px] items-center gap-8 py-6 lg:grid-cols-[1fr_1.08fr] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="z-20 max-w-2xl"
        >
          <p className="inline-flex rounded-full border border-cyan-300/35 bg-slate-900/75 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200 shadow-[0_10px_28px_rgba(6,182,212,0.2)]">
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
            <Button size="lg" href="/auth?role=intern">
              Join as Intern
            </Button>
            <Button size="lg" variant="secondary" href="/auth?role=company">
              Join as Company
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Resume upload intelligence
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Skill gap detection
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/75 px-3 py-1 text-slate-200 shadow-[0_8px_20px_rgba(2,6,23,0.5)]">
              Verified hiring progress
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28, scale: 0.97 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="relative h-full min-h-[460px] w-full sm:min-h-[540px] lg:min-h-[620px]"
        >
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-700/55 bg-slate-900/30 shadow-[0_22px_46px_rgba(2,6,23,0.5)]">
            <img src={HERO_REFERENCE_IMAGE} alt="AI internship workflow reference" className="h-full w-full object-contain p-3" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_55%),linear-gradient(180deg,rgba(2,6,23,0.05)_0%,rgba(2,6,23,0.38)_100%)]" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

