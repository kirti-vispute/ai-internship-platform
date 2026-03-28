"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PremiumCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const enabled = pathname === "/";

  useEffect(() => {
    const isHomepage = pathname === "/";
    if (!isHomepage || window.matchMedia("(pointer: coarse)").matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...mouse };
    const dotPos = { ...mouse };
    let hovered = false;
    let activeEl: HTMLElement | null = null;
    let rafId = 0;

    const selectors = "a, button, [role='button'], [data-cursor='interactive']";

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
    };

    const onPointerOver = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const matched = target?.closest(selectors) as HTMLElement | null;
      hovered = Boolean(matched);
      activeEl = matched;
    };

    const onPointerOut = () => {
      if (!document.querySelector(":hover")) {
        hovered = false;
        activeEl = null;
      }
    };

    const animate = () => {
      let targetX = mouse.x;
      let targetY = mouse.y;

      if (hovered && activeEl) {
        const rect = activeEl.getBoundingClientRect();
        targetX += ((rect.left + rect.width / 2) - mouse.x) * 0.25;
        targetY += ((rect.top + rect.height / 2) - mouse.y) * 0.25;
      }

      dotPos.x += (targetX - dotPos.x) * 0.34;
      dotPos.y += (targetY - dotPos.y) * 0.34;
      ringPos.x += (targetX - ringPos.x) * 0.14;
      ringPos.y += (targetY - ringPos.y) * 0.14;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${hovered ? 1.55 : 1})`;
      ring.style.opacity = hovered ? "0.9" : "0.62";

      rafId = window.requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("pointerout", onPointerOut, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
    };
  }, [pathname]);

  return (
    <>
      <div
        ref={ringRef}
        className={`pointer-events-none fixed left-0 top-0 z-[120] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_24px_rgba(56,189,248,0.35)] backdrop-blur ${enabled ? "sm:block" : "hidden"}`}
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className={`pointer-events-none fixed left-0 top-0 z-[120] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.9)] ${enabled ? "sm:block" : "hidden"}`}
        aria-hidden="true"
      />
    </>
  );
}
