"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  bright: boolean;
};

function createStars(width: number, height: number): Star[] {
  const count = Math.min(85, Math.max(45, Math.floor((width * height) / 22000)));
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.14,
    vy: (Math.random() - 0.5) * 0.14,
    r: Math.random() < 0.1 ? 1.2 : 0.45 + Math.random() * 0.55,
    baseOpacity: 0.12 + Math.random() * 0.28,
    twinkleSpeed: 0.0006 + Math.random() * 0.0012,
    twinkleOffset: Math.random() * Math.PI * 2,
    bright: Math.random() < 0.07
  }));
}

export function StarfieldLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const scrollRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starsRef.current = createStars(w, h);
    };

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const draw = (now: number) => {
      const { w, h } = sizeRef.current;
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const parallax = scrollRef.current * 0.06;
      ctx.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < -2) star.x = w + 2;
        if (star.x > w + 2) star.x = -2;
        if (star.y < -2) star.y = h + 2;
        if (star.y > h + 2) star.y = -2;

        const twinkle = 0.5 + 0.5 * Math.sin(now * star.twinkleSpeed + star.twinkleOffset);
        const alpha = Math.min(0.65, star.baseOpacity * twinkle * (star.bright ? 1.15 : 1));
        const drawY = ((star.y - parallax) % h + h) % h;

        ctx.beginPath();
        ctx.arc(star.x, drawY, star.r, 0, Math.PI * 2);

        if (star.bright) {
          const gradient = ctx.createRadialGradient(star.x, drawY, 0, star.x, drawY, star.r * 2.5);
          gradient.addColorStop(0, `rgba(210, 228, 255, ${alpha})`);
          gradient.addColorStop(1, "rgba(210, 228, 255, 0)");
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.85})`;
        }
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="internai-starfield-layer pointer-events-none absolute inset-0 z-[2] h-full w-full"
      aria-hidden
    />
  );
}
