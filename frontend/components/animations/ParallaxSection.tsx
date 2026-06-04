"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParallaxSectionProps = {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ParallaxSection({ children, className, intensity = 26 }: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    let rafId = 0;
    let ticking = false;

    const update = () => {
      ticking = false;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const progress = clamp((viewportHeight - rect.top) / (viewportHeight + rect.height), 0, 1);
      const shift = (0.5 - progress) * intensity;
      element.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      rafId = window.requestAnimationFrame(update);
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      element.style.transform = "";
    };
  }, [intensity]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}

