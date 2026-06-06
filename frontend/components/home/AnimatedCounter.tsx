"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ParsedValue = {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
};

function parseDisplayValue(raw: string): ParsedValue {
  const match = raw.trim().match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) {
    return { prefix: "", target: 0, suffix: raw, decimals: 0 };
  }
  const numeric = match[2];
  const decimals = numeric.includes(".") ? numeric.split(".")[1].length : 0;
  return {
    prefix: match[1],
    target: Number(numeric),
    suffix: match[3],
    decimals
  };
}

type AnimatedCounterProps = {
  value: string;
  className?: string;
  durationMs?: number;
};

export function AnimatedCounter({ value, className, durationMs = 1400 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = useReducedMotion();
  const parsed = parseDisplayValue(value);
  const [display, setDisplay] = useState(reducedMotion ? value : `${parsed.prefix}0${parsed.suffix}`);
  const isInView = useInView(ref, { once: false, amount: 0.55, margin: "0px 0px -8% 0px" });
  const hasAnimatedRef = useRef(false);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!isInView) {
      hasAnimatedRef.current = false;
      return;
    }
    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    const runId = ++runIdRef.current;
    hasAnimatedRef.current = true;
    const start = performance.now();

    const tick = (now: number) => {
      if (runId !== runIdRef.current) return;
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parsed.target * eased;
      const formatted =
        parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
      setDisplay(`${parsed.prefix}${formatted}${parsed.suffix}`);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    setDisplay(`${parsed.prefix}0${parsed.suffix}`);
    requestAnimationFrame(tick);
  }, [isInView, reducedMotion, value, durationMs, parsed.prefix, parsed.suffix, parsed.target, parsed.decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {display}
    </span>
  );
}
