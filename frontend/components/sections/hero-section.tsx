"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { WorkflowModule } from "@/components/home/HeroScene";

const HeroScene = dynamic(() => import("@/components/home/HeroScene").then((mod) => mod.HeroScene), {
  ssr: false,
  loading: () => null
});

type WorkflowTile = {
  id: WorkflowModule;
  label: string;
  detail: string;
  left: string;
  top: string;
  side: "left" | "right";
};

const workflowModules: WorkflowTile[] = [
  {
    id: "resume-upload",
    label: "Resume Upload",
    detail: "Student profile enters the AI system.",
    left: "8%",
    top: "19%",
    side: "left"
  },
  {
    id: "resume-score",
    label: "Resume Score",
    detail: "Strength score and ATS signal generated.",
    left: "68%",
    top: "20%",
    side: "right"
  },
  {
    id: "skill-gap",
    label: "Skill Gap",
    detail: "Missing skills mapped for target roles.",
    left: "68%",
    top: "36%",
    side: "right"
  },
  {
    id: "verified-match",
    label: "Verified Match",
    detail: "Trusted company matches are surfaced.",
    left: "68%",
    top: "52%",
    side: "right"
  },
  {
    id: "hiring-pipeline",
    label: "Hiring Pipeline",
    detail: "Applications move through live stages.",
    left: "68%",
    top: "68%",
    side: "right"
  }
];

function nearEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

export function HeroSection() {
  const [activeModule, setActiveModule] = useState<WorkflowModule | null>("ai-engine");
  const animationRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Partial<Record<WorkflowModule, HTMLButtonElement | null>>>({});
  const cursorBiasRef = useRef({ x: 0, y: 0, proximity: 0 });
  const pointerTargetRef = useRef({ x: 0, y: 0, proximity: 0 });
  const [connectorAnchors, setConnectorAnchors] = useState<Partial<Record<WorkflowModule, { xPct: number; yPct: number }>>>({});

  const desktopTiles = useMemo(() => workflowModules.filter((module) => module.id !== "ai-engine"), []);

  const updateAnchors = useCallback(() => {
    const container = animationRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width || 1;
    const height = containerRect.height || 1;

    const nextAnchors: Partial<Record<WorkflowModule, { xPct: number; yPct: number }>> = {};

    desktopTiles.forEach((module) => {
      const tile = tileRefs.current[module.id];
      if (tile && tile.offsetParent !== null) {
        const rect = tile.getBoundingClientRect();
        const x = module.side === "left" ? rect.right - containerRect.left : rect.left - containerRect.left;
        const y = rect.top + rect.height / 2 - containerRect.top;
        nextAnchors[module.id] = {
          xPct: Math.min(0.99, Math.max(0.01, x / width)),
          yPct: Math.min(0.99, Math.max(0.01, y / height))
        };
      } else {
        const leftPct = Number.parseFloat(module.left) / 100;
        const topPct = Number.parseFloat(module.top) / 100;
        nextAnchors[module.id] = {
          xPct: module.side === "left" ? leftPct + 0.215 : leftPct,
          yPct: topPct
        };
      }
    });

    setConnectorAnchors((prev) => {
      const unchanged = desktopTiles.every((module) => {
        const prevValue = prev[module.id];
        const nextValue = nextAnchors[module.id];
        if (!prevValue || !nextValue) return false;
        return nearEqual(prevValue.xPct, nextValue.xPct) && nearEqual(prevValue.yPct, nextValue.yPct);
      });
      return unchanged ? prev : nextAnchors;
    });
  }, [desktopTiles]);

  useEffect(() => {
    updateAnchors();

    const container = animationRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => updateAnchors());
    observer.observe(container);
    window.addEventListener("resize", updateAnchors);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateAnchors);
    };
  }, [updateAnchors]);

  useEffect(() => {
    const container = animationRef.current;
    if (!container) return;

    let rafId = 0;

    const step = () => {
      const target = pointerTargetRef.current;
      const current = cursorBiasRef.current;
      current.x += (target.x - current.x) * 0.11;
      current.y += (target.y - current.y) * 0.11;
      current.proximity += (target.proximity - current.proximity) * 0.1;

      container.style.setProperty("--hero-nx", current.x.toFixed(4));
      container.style.setProperty("--hero-ny", current.y.toFixed(4));
      container.style.setProperty("--hero-prox", current.proximity.toFixed(4));

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(rafId);
  }, []);

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
          ref={animationRef}
          onMouseMove={(event) => {
            const rect = animationRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
            pointerTargetRef.current.x = Math.max(-1, Math.min(1, x));
            pointerTargetRef.current.y = Math.max(-1, Math.min(1, y));
            pointerTargetRef.current.proximity = Math.max(0, 1 - Math.min(1, Math.hypot(x, y)));
          }}
          onMouseLeave={() => {
            pointerTargetRef.current.x = 0;
            pointerTargetRef.current.y = 0;
            pointerTargetRef.current.proximity = 0;
            setActiveModule("ai-engine");
          }}
        >
          <HeroScene activeModule={activeModule} connectorAnchors={connectorAnchors} cursorBiasRef={cursorBiasRef} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_37%_43%,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_22%_18%,rgba(125,211,252,0.1),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(129,140,248,0.1),transparent_40%)]" />

          <div className="absolute inset-0 z-20 hidden lg:block">
            {desktopTiles.map((module) => {
              const isActive = activeModule === module.id;
              const pxFactor = module.side === "right" ? 8 : 5;
              const pyFactor = module.side === "right" ? 6 : 4;

              return (
                <div
                  key={module.id}
                  style={{
                    left: module.left,
                    top: module.top,
                    transform: `translateY(-50%) translate3d(calc(var(--hero-nx, 0) * ${pxFactor}px), calc(var(--hero-ny, 0) * ${pyFactor}px), 0)`
                  }}
                  className="absolute"
                >
                  <button
                    ref={(node) => {
                      tileRefs.current[module.id] = node;
                    }}
                    type="button"
                    onMouseEnter={() => {
                      setActiveModule(module.id);
                      window.requestAnimationFrame(updateAnchors);
                    }}
                    onMouseLeave={() => {
                      setActiveModule("ai-engine");
                      window.requestAnimationFrame(updateAnchors);
                    }}
                    className={`group relative w-[156px] overflow-hidden rounded-xl border px-2.5 py-1.5 text-left backdrop-blur-[2px] transition-all duration-300 ${
                      isActive
                        ? "border-cyan-300/55 bg-slate-900/43 shadow-[0_10px_24px_rgba(34,211,238,0.2)]"
                        : "border-slate-400/28 bg-slate-900/26 shadow-[0_7px_16px_rgba(2,6,23,0.24)]"
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-xl border border-cyan-300/20 opacity-65 animate-pulse-slow" />
                    <p className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-200/95">{module.label}</p>
                    <p className="relative z-10 mt-1 text-[10px] leading-[1.1rem] text-slate-200/85">{module.detail}</p>
                  </button>
                </div>
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




