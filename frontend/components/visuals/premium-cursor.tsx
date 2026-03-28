"use client";

import { useEffect, useRef } from "react";

export function PremiumCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...mouse };
    const dotPos = { ...mouse };
    let hovered = false;
    let rafId = 0;

    const selectors = "a, button, [role='button'], [data-cursor='interactive'], input, textarea, select";

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const onPointerOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      hovered = Boolean(target?.closest(selectors));
    };

    const animate = () => {
      dotPos.x += (mouse.x - dotPos.x) * 0.34;
      dotPos.y += (mouse.y - dotPos.y) * 0.34;
      ringPos.x += (mouse.x - ringPos.x) * 0.14;
      ringPos.y += (mouse.y - ringPos.y) * 0.14;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${hovered ? 1.7 : 1})`;
      ring.style.opacity = hovered ? "0.9" : "0.62";

      rafId = window.requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_24px_rgba(56,189,248,0.35)] backdrop-blur sm:block"
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[120] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.9)] sm:block"
        aria-hidden="true"
      />
    </>
  );
}
