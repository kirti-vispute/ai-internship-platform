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

type TileEdge = "left" | "right" | "top" | "bottom" | "center";

type TileAnchorSet = Record<TileEdge, { xPct: number; yPct: number }>;

type WorkflowTile = {
  id: WorkflowModule;
  label: string;
  detail: string;
  left: string;
  top: string;
};

const workflowModules: WorkflowTile[] = [
  {
    id: "resume-upload",
    label: "Resume Upload",
    detail: "Profile enters the AI workflow.",
    left: "8%",
    top: "32%"
  },
  {
    id: "resume-score",
    label: "Resume Score",
    detail: "ATS and strength signal generated.",
    left: "67%",
    top: "24%"
  },
  {
    id: "skill-gap",
    label: "Skill Gap",
    detail: "Missing capabilities mapped live.",
    left: "67%",
    top: "44%"
  },
  {
    id: "verified-match",
    label: "Verified Match",
    detail: "Trusted company fit confidence.",
    left: "61%",
    top: "63%"
  },
  {
    id: "hiring-pipeline",
    label: "Hiring Pipeline",
    detail: "Outcome stages and progression.",
    left: "45%",
    top: "79%"
  }
];

const tileGlyph: Partial<Record<WorkflowModule, { dot: string; bars: string[] }>> = {
  "resume-upload": {
    dot: "bg-cyan-300",
    bars: ["w-6 bg-cyan-200/70", "w-4 bg-sky-300/60", "w-3 bg-indigo-300/50"]
  },
  "resume-score": {
    dot: "bg-sky-300",
    bars: ["w-3 bg-cyan-200/70", "w-5 bg-sky-300/65", "w-6 bg-indigo-300/55"]
  },
  "skill-gap": {
    dot: "bg-teal-300",
    bars: ["w-5 bg-cyan-200/65", "w-3 bg-amber-300/65", "w-6 bg-teal-300/55"]
  },
  "verified-match": {
    dot: "bg-emerald-300",
    bars: ["w-4 bg-cyan-200/65", "w-5 bg-emerald-300/65", "w-3 bg-indigo-300/55"]
  },
  "hiring-pipeline": {
    dot: "bg-indigo-300",
    bars: ["w-3 bg-cyan-200/65", "w-4 bg-sky-300/65", "w-5 bg-indigo-300/55"]
  }
};

function nearEqual(a: number, b: number) {
  return Math.abs(a - b) < 0.001;
}

function buildAnchorSetFromRect(
  rect: DOMRect,
  containerRect: DOMRect,
  bounds: { width: number; height: number }
): TileAnchorSet {
  const centerX = rect.left + rect.width / 2 - containerRect.left;
  const centerY = rect.top + rect.height / 2 - containerRect.top;

  return {
    left: {
      xPct: Math.min(0.995, Math.max(0.005, (rect.left - containerRect.left) / bounds.width)),
      yPct: Math.min(0.995, Math.max(0.005, centerY / bounds.height))
    },
    right: {
      xPct: Math.min(0.995, Math.max(0.005, (rect.right - containerRect.left) / bounds.width)),
      yPct: Math.min(0.995, Math.max(0.005, centerY / bounds.height))
    },
    top: {
      xPct: Math.min(0.995, Math.max(0.005, centerX / bounds.width)),
      yPct: Math.min(0.995, Math.max(0.005, (rect.top - containerRect.top) / bounds.height))
    },
    bottom: {
      xPct: Math.min(0.995, Math.max(0.005, centerX / bounds.width)),
      yPct: Math.min(0.995, Math.max(0.005, (rect.bottom - containerRect.top) / bounds.height))
    },
    center: {
      xPct: Math.min(0.995, Math.max(0.005, centerX / bounds.width)),
      yPct: Math.min(0.995, Math.max(0.005, centerY / bounds.height))
    }
  };
}

function buildFallbackAnchors(module: WorkflowTile, width: number, height: number): TileAnchorSet {
  const TILE_WIDTH = 156;
  const TILE_HEIGHT = 60;
  const leftPx = (Number.parseFloat(module.left) / 100) * width;
  const topPx = (Number.parseFloat(module.top) / 100) * height;

  const mockRect = {
    left: leftPx,
    right: leftPx + TILE_WIDTH,
    top: topPx - TILE_HEIGHT / 2,
    bottom: topPx + TILE_HEIGHT / 2,
    width: TILE_WIDTH,
    height: TILE_HEIGHT
  } as DOMRect;

  return buildAnchorSetFromRect(mockRect, { left: 0, top: 0 } as DOMRect, { width, height });
}

export function HeroSection() {
  const [activeModule, setActiveModule] = useState<WorkflowModule | null>("ai-engine");
  const animationRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Partial<Record<WorkflowModule, HTMLButtonElement | null>>>({});
  const cursorBiasRef = useRef({ x: 0, y: 0, proximity: 0 });
  const [connectorAnchors, setConnectorAnchors] = useState<Partial<Record<WorkflowModule, TileAnchorSet>>>({});

  const desktopTiles = useMemo(() => workflowModules.filter((module) => module.id !== "ai-engine"), []);

  const updateAnchors = useCallback(() => {
    const container = animationRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width || 1;
    const height = containerRect.height || 1;

    const nextAnchors: Partial<Record<WorkflowModule, TileAnchorSet>> = {};

    desktopTiles.forEach((module) => {
      const tile = tileRefs.current[module.id];
      if (tile && tile.offsetParent !== null) {
        const rect = tile.getBoundingClientRect();
        nextAnchors[module.id] = buildAnchorSetFromRect(rect, containerRect, { width, height });
      } else {
        nextAnchors[module.id] = buildFallbackAnchors(module, width, height);
      }
    });

    setConnectorAnchors((prev) => {
      const unchanged = desktopTiles.every((module) => {
        const prevValue = prev[module.id];
        const nextValue = nextAnchors[module.id];
        if (!prevValue || !nextValue) return false;
        return (
          nearEqual(prevValue.left.xPct, nextValue.left.xPct) &&
          nearEqual(prevValue.left.yPct, nextValue.left.yPct) &&
          nearEqual(prevValue.right.xPct, nextValue.right.xPct) &&
          nearEqual(prevValue.right.yPct, nextValue.right.yPct) &&
          nearEqual(prevValue.top.xPct, nextValue.top.xPct) &&
          nearEqual(prevValue.top.yPct, nextValue.top.yPct) &&
          nearEqual(prevValue.bottom.xPct, nextValue.bottom.xPct) &&
          nearEqual(prevValue.bottom.yPct, nextValue.bottom.yPct)
        );
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
            cursorBiasRef.current.x = Math.max(-1, Math.min(1, x));
            cursorBiasRef.current.y = Math.max(-1, Math.min(1, y));
            cursorBiasRef.current.proximity = Math.max(0, 1 - Math.min(1, Math.hypot(x, y)));
          }}
          onMouseLeave={() => {
            cursorBiasRef.current.x = 0;
            cursorBiasRef.current.y = 0;
            cursorBiasRef.current.proximity = 0;
            setActiveModule("ai-engine");
          }}
        >
          <HeroScene activeModule={activeModule} connectorAnchors={connectorAnchors} cursorBiasRef={cursorBiasRef} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_37%_43%,rgba(99,102,241,0.14),transparent_30%),radial-gradient(circle_at_22%_18%,rgba(125,211,252,0.1),transparent_44%),radial-gradient(circle_at_82%_78%,rgba(129,140,248,0.1),transparent_40%)]" />

          <div className="absolute inset-0 z-20 hidden lg:block">
            {desktopTiles.map((module) => {
              const isActive = activeModule === module.id;
              const glyph = tileGlyph[module.id] ?? { dot: "bg-cyan-300", bars: ["w-4 bg-cyan-200/70", "w-4 bg-sky-300/60", "w-4 bg-indigo-300/50"] };

              return (
                <div
                  key={module.id}
                  style={{
                    left: module.left,
                    top: module.top,
                    transform: "translateY(-50%)"
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
                    <div className="relative z-10 mb-1.5 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${glyph.dot}`} />
                      <div className="flex items-center gap-1">
                        {glyph.bars.map((bar, idx) => (
                          <span key={`${module.id}-bar-${idx}`} className={`h-0.5 rounded-full ${bar}`} />
                        ))}
                      </div>
                    </div>
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

