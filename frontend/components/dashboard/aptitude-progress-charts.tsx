"use client";

import { APTITUDE_SECTIONS } from "@/lib/data/aptitude-tests";
import type { AptitudeProgressPoint } from "@/lib/aptitude-progress";
import type { AptitudeSectionKey } from "@/lib/aptitude-test-engine";
import { cn } from "@/lib/utils";

type LineChartProps = {
  data: AptitudeProgressPoint[];
  valueKey: "score" | "readiness" | "accuracy";
  label: string;
  color?: string;
  maxY?: number;
};

function LineChart({ data, valueKey, label, color = "#0ea5e9", maxY }: LineChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-slate-500 dark:text-slate-400">
        Complete a test to see trends
      </div>
    );
  }

  const width = 320;
  const height = 140;
  const pad = { top: 12, right: 12, bottom: 24, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const values = data.map((d) => d[valueKey]);
  const yMax = maxY ?? Math.max(...values, 10);
  const yMin = 0;

  const points = data.map((d, i) => {
    const x = pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - ((d[valueKey] - yMin) / (yMax - yMin)) * innerH;
    return { x, y, test: d.test, value: d[valueKey] };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full max-w-md" role="img" aria-label={label}>
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="1"
        />
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={polyline} />
        {points.map((p) => (
          <g key={p.test}>
            <circle cx={p.x} cy={p.y} r="3.5" fill={color} />
            <text x={p.x} y={height - 6} textAnchor="middle" className="fill-slate-400 text-[9px]">
              T{p.test}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

type SectionChartProps = {
  data: AptitudeProgressPoint[];
};

function SectionTrendChart({ data }: SectionChartProps) {
  if (!data.length) return null;

  const colors: Record<AptitudeSectionKey, string> = {
    quantitative: "#10b981",
    logical: "#8b5cf6",
    verbal: "#f59e0b",
    dataInterpretation: "#f43f5e"
  };

  const width = 320;
  const height = 140;
  const pad = { top: 12, right: 12, bottom: 24, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allValues = data.flatMap((d) => Object.values(d.sectionScores));
  const yMax = Math.max(...allValues, 10);

  const lines = APTITUDE_SECTIONS.map((section) => {
    const points = data.map((d, i) => {
      const x = pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
      const val = d.sectionScores[section.key];
      const y = pad.top + innerH - (val / yMax) * innerH;
      return `${x},${y}`;
    });
    return { section, points: points.join(" "), color: colors[section.key] };
  });

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Section-wise improvement</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full max-w-md" role="img" aria-label="Section trends">
        <line
          x1={pad.left}
          y1={pad.top + innerH}
          x2={pad.left + innerW}
          y2={pad.top + innerH}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="1"
        />
        {lines.map((line) => (
          <polyline
            key={line.section.key}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={line.points}
            opacity="0.9"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {APTITUDE_SECTIONS.map((section) => (
          <span key={section.key} className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: colors[section.key] }} />
            {section.shortLabel}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AptitudeProgressCharts({ data }: { data: AptitudeProgressPoint[] }) {
  const recent = data.slice(-10);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className={cn("rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 dark:border-slate-800/60 dark:bg-slate-900/20")}>
        <LineChart data={recent} valueKey="score" label="Total score trend" color="#0ea5e9" />
      </div>
      <div className={cn("rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 dark:border-slate-800/60 dark:bg-slate-900/20")}>
        <LineChart data={recent} valueKey="readiness" label="Interview readiness trend" color="#6366f1" maxY={100} />
      </div>
      <div className={cn("md:col-span-2 rounded-xl border border-slate-200/60 bg-slate-50/40 p-4 dark:border-slate-800/60 dark:bg-slate-900/20")}>
        <SectionTrendChart data={recent} />
      </div>
    </div>
  );
}
