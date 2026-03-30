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

const DIAGRAM_GRID = {
  columns: 12,
  rows: 10
} as const;
const RIGHT_COLUMN = 10.8;
const TOP_ROW = 1.9;
const ROW_STEP = 2;

function toDiagramStyle(column: number, row: number) {
  return {
    left: `${(column / DIAGRAM_GRID.columns) * 100}%`,
    top: `${(row / DIAGRAM_GRID.rows) * 100}%`,
    transform: "translate(-50%, -50%)"
  } as const;
}

const workflowModules: Array<{
  id: WorkflowModule;
  label: string;
  detail: string;
  column: number;
  row: number;
}> = [
  {
    id: "resume-upload",
    label: "Resume Upload",
    detail: "Student profile enters the AI system.",
    column: 1.8,
    row: 1.9
  },
  {
    id: "resume-score",
    label: "Resume Score",
    detail: "Strength score and ATS signal generated.",
    column: RIGHT_COLUMN,
    row: TOP_ROW
  },
  {
    id: "skill-gap",
    label: "Skill Gap",
    detail: "Missing skills mapped for target roles.",
    column: RIGHT_COLUMN,
    row: TOP_ROW + ROW_STEP
  },
  {
    id: "verified-match",
    label: "Verified Match",
    detail: "Trusted company matches are surfaced.",
    column: RIGHT_COLUMN,
    row: TOP_ROW + ROW_STEP * 2
  },
  {
    id: "hiring-pipeline",
    label: "Hiring Pipeline",
    detail: "Applications move through live stages.",
    column: RIGHT_COLUMN,
    row: TOP_ROW + ROW_STEP * 3
  }
];

export function HeroSection() {
  const [activeModule, setActiveModule] = useState<WorkflowModule | null>("ai-engine");

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
                  onMouseLeave={() => setActiveModule("ai-engine")}
                  style={toDiagramStyle(module.column, module.row)}
                  className={`group absolute w-[156px] rounded-xl border px-2.5 py-1.5 text-left backdrop-blur-[2px] transition-all duration-300 ${
                    isActive
                      ? "border-cyan-300/42 bg-slate-900/40 shadow-[0_8px_18px_rgba(34,211,238,0.14)]"
                      : "border-slate-400/22 bg-slate-900/24 shadow-[0_6px_14px_rgba(2,6,23,0.22)]"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/95">{module.label}</p>
                  <p className="mt-1 text-[10px] leading-[1.1rem] text-slate-200/85">{module.detail}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/55 p-3 shadow-[0_14px_26px_rgba(2,6,23,0.35)] sm:grid-cols-2 lg:hidden">
          {workflowModules.map((module) => {
            const isActive = activeModule === module.id;
            return (
              <button
                key={`mobile-${module.id}`}
                type="button"
                onMouseEnter={() => setActiveModule(module.id)}
                onMouseLeave={() => setActiveModule("ai-engine")}
                className={`rounded-xl border px-3 py-2 text-left transition-all duration-300 ${
                  isActive ? "border-cyan-300/70 bg-slate-900/82" : "border-slate-600/50 bg-slate-900/62"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-200">{module.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-200/90">{module.detail}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
