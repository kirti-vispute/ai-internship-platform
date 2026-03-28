"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { WorkflowModule } from "@/components/home/HeroScene";

const HeroScene = dynamic(() => import("@/components/home/HeroScene").then((mod) => mod.HeroScene), {
  ssr: false,
  loading: () => null
});

const workflowModules: Array<{
  id: WorkflowModule;
  label: string;
  detail: string;
  className: string;
}> = [
  {
    id: "resume-upload",
    label: "Resume Upload",
    detail: "Student profile enters the AI system.",
    className: "left-[3%] top-[20%]"
  },
  {
    id: "ai-engine",
    label: "AI Engine",
    detail: "Model analyzes resume structure and fit.",
    className: "left-[41%] top-[44%]"
  },
  {
    id: "resume-score",
    label: "Resume Score",
    detail: "Strength score and ATS signal generated.",
    className: "right-[8%] top-[11%]"
  },
  {
    id: "skill-gap",
    label: "Skill Gap",
    detail: "Missing skills mapped for target roles.",
    className: "right-[2%] top-[34%]"
  },
  {
    id: "verified-match",
    label: "Verified Match",
    detail: "Only trusted company matches are surfaced.",
    className: "right-[3%] top-[56%]"
  },
  {
    id: "hiring-pipeline",
    label: "Hiring Pipeline",
    detail: "Applications move through real-time stages.",
    className: "bottom-[12%] right-[11%]"
  }
];

export function HeroSection() {
  const [activeModule, setActiveModule] = useState<WorkflowModule | null>(null);

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
          className="relative h-[460px] sm:h-[540px] lg:h-[620px]"
        >
          <HeroScene activeModule={activeModule} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_37%_43%,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_22%_18%,rgba(125,211,252,0.1),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(129,140,248,0.1),transparent_40%)]" />

          <div className="absolute inset-0 z-20 hidden lg:block">
            {workflowModules.map((module) => {
              const isActive = activeModule === module.id;
              return (
                <button
                  key={module.id}
                  type="button"
                  onMouseEnter={() => setActiveModule(module.id)}
                  onMouseLeave={() => setActiveModule(null)}
                  className={`group absolute max-w-[170px] rounded-2xl border px-3 py-2 text-left backdrop-blur-md transition-all duration-300 ${module.className} ${
                    isActive
                      ? "border-cyan-300/70 bg-slate-900/80 shadow-[0_18px_34px_rgba(34,211,238,0.28)]"
                      : "border-slate-500/40 bg-slate-900/56 shadow-[0_12px_24px_rgba(2,6,23,0.36)]"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-200">{module.label}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-200/90">{module.detail}</p>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
