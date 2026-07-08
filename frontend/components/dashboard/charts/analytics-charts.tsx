"use client";

import { memo, useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type TrendPoint = { label: string; value: number };
export type BarDatum = { label: string; value: number; hint?: string };

const CHART_WIDTH = 640;
const CHART_HEIGHT = 200;
const PADDING_X = 8;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

function buildAreaPath(points: { x: number; y: number }[], baselineY: number) {
  if (points.length === 0) return "";
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x},${baselineY} L${first.x},${baselineY} Z`;
}

function buildLinePath(points: { x: number; y: number }[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
}

/**
 * Lightweight dependency-free SVG trend chart. No charting library is installed in this
 * project, so this renders directly to keep the bundle small for a handful of dashboard charts.
 */
function TrendAreaChartInner({
  data,
  valueLabel = "applications",
  className
}: {
  data: TrendPoint[];
  valueLabel?: string;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const gradientId = useId();

  const { linePoints, maxValue, total, latest, gridLines } = useMemo(() => {
    const max = Math.max(...data.map((point) => point.value), 1);
    const plotWidth = CHART_WIDTH - PADDING_X * 2;
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
    const step = data.length > 1 ? plotWidth / (data.length - 1) : 0;

    const points = data.map((point, index) => ({
      x: PADDING_X + step * index,
      y: PADDING_TOP + plotHeight - (point.value / max) * plotHeight,
      ...point
    }));

    const lines = [0, 0.5, 1].map((ratio) => ({
      y: PADDING_TOP + plotHeight * (1 - ratio),
      value: Math.round(max * ratio)
    }));

    return {
      linePoints: points,
      maxValue: max,
      total: data.reduce((sum, point) => sum + point.value, 0),
      latest: data[data.length - 1]?.value ?? 0,
      gridLines: lines
    };
  }, [data]);

  const baselineY = CHART_HEIGHT - PADDING_BOTTOM;
  const areaPath = buildAreaPath(linePoints, baselineY);
  const linePath = buildLinePath(linePoints);
  const labelStride = data.length > 8 ? Math.ceil(data.length / 6) : 1;

  return (
    <div className={cn("w-full", className)}>
      <p className="ds-caption">
        {total} {valueLabel} total &middot; latest period {latest}
      </p>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        role="img"
        aria-label={`Trend of ${valueLabel} over time. Total ${total}, most recent period ${latest}.`}
        className="mt-2 h-44 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => (
          <g key={line.value}>
            <line
              x1={PADDING_X}
              x2={CHART_WIDTH - PADDING_X}
              y1={line.y}
              y2={line.y}
              stroke="var(--ds-border)"
              strokeWidth={1}
            />
            <text x={CHART_WIDTH - PADDING_X} y={line.y - 4} textAnchor="end" className="fill-[var(--ds-muted)] text-[10px]">
              {line.value}
            </text>
          </g>
        ))}

        <motion.path
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--ds-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: "easeOut" }}
        />

        {linePoints.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r={3} fill="var(--ds-accent)">
            <title>
              {point.label}: {point.value} {valueLabel}
            </title>
          </circle>
        ))}

        {linePoints.map((point, index) =>
          index % labelStride === 0 ? (
            <text
              key={`label-${point.label}`}
              x={point.x}
              y={CHART_HEIGHT - 8}
              textAnchor={index === 0 ? "start" : index === linePoints.length - 1 ? "end" : "middle"}
              className="fill-[var(--ds-muted)] text-[10px]"
            >
              {point.label}
            </text>
          ) : null
        )}
      </svg>

      <table className="sr-only">
        <caption>{valueLabel} by period</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{point.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const TrendAreaChart = memo(TrendAreaChartInner);

function HorizontalBarChartInner({ data, className }: { data: BarDatum[]; className?: string }) {
  const reducedMotion = useReducedMotion();
  const maxValue = Math.max(...data.map((bar) => bar.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((bar) => (
        <div key={bar.label} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="ds-caption truncate font-medium text-[var(--ds-text)]">{bar.label}</span>
              {bar.hint ? <span className="ds-caption shrink-0">{bar.hint}</span> : null}
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-[var(--ds-accent)]"
                initial={reducedMotion ? { width: `${Math.max(4, (bar.value / maxValue) * 100)}%` } : { width: 0 }}
                animate={{ width: `${Math.max(4, (bar.value / maxValue) * 100)}%` }}
                transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          <span className="text-right text-sm font-semibold tabular-nums">{bar.value}</span>
        </div>
      ))}
    </div>
  );
}

export const HorizontalBarChart = memo(HorizontalBarChartInner);
