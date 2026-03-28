"use client";

import { useEffect, useMemo, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], [data-cursor]";
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

export function CustomCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trailIndexes = useMemo(() => [0, 1, 2, 3, 4], []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.body.classList.add("cursor-3d-enabled");

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...mouse };
    const dotPos = { ...mouse };
    const trailPos = trailIndexes.map(() => ({ ...mouse }));

    let hoverState: "default" | "link" | "button" | "card" | "text" = "default";
    let activeEl: HTMLElement | null = null;
    let rafId = 0;

    const setHoverState = (target: HTMLElement | null) => {
      if (!target) {
        hoverState = "default";
        activeEl = null;
        return;
      }

      if (target.closest(TEXT_SELECTOR)) {
        hoverState = "text";
        activeEl = null;
        return;
      }

      const interactive = target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!interactive) {
        hoverState = "default";
        activeEl = null;
        return;
      }

      activeEl = interactive;
      const explicit = interactive.dataset.cursor;
      if (explicit === "card" || explicit === "button" || explicit === "link") {
        hoverState = explicit;
        return;
      }

      hoverState = interactive.tagName.toLowerCase() === "a" ? "link" : "button";
    };

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      setHoverState(event.target as HTMLElement | null);
    };

    const onFocusIn = (event: FocusEvent) => {
      setHoverState(event.target as HTMLElement | null);
    };

    const onPointerOver = (event: Event) => {
      setHoverState(event.target as HTMLElement | null);
    };

    const animate = () => {
      let targetX = mouse.x;
      let targetY = mouse.y;

      if (activeEl && hoverState !== "text") {
        const rect = activeEl.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        targetX += (centerX - mouse.x) * 0.2;
        targetY += (centerY - mouse.y) * 0.2;
      }

      dotPos.x += (targetX - dotPos.x) * 0.35;
      dotPos.y += (targetY - dotPos.y) * 0.35;
      ringPos.x += (targetX - ringPos.x) * 0.16;
      ringPos.y += (targetY - ringPos.y) * 0.16;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;

      let scale = 1;
      let ringOpacity = 0.7;
      let ringColor = "rgba(56,189,248,0.7)";
      if (hoverState === "link") {
        scale = 1.5;
        ringOpacity = 0.95;
      } else if (hoverState === "button") {
        scale = 1.75;
        ringOpacity = 1;
        ringColor = "rgba(99,102,241,0.78)";
      } else if (hoverState === "card") {
        scale = 1.35;
        ringOpacity = 0.9;
      } else if (hoverState === "text") {
        ringOpacity = 0;
      }

      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) scale(${scale})`;
      ring.style.opacity = String(ringOpacity);
      ring.style.borderColor = ringColor;

      dot.style.opacity = hoverState === "text" ? "0" : "1";

      trailRefs.current.forEach((trail, index) => {
        if (!trail) return;
        const lead = index === 0 ? dotPos : trailPos[index - 1];
        trailPos[index].x += (lead.x - trailPos[index].x) * (0.24 - index * 0.02);
        trailPos[index].y += (lead.y - trailPos[index].y) * (0.24 - index * 0.02);
        trail.style.transform = `translate3d(${trailPos[index].x}px, ${trailPos[index].y}px, 0) scale(${1 - index * 0.13})`;
        trail.style.opacity = hoverState === "text" ? "0" : `${0.32 - index * 0.05}`;
      });

      rafId = window.requestAnimationFrame(animate);
    };
    animate();

    const applyTilt = (element: HTMLElement, x: number, y: number) => {
      element.style.setProperty("--tilt-x", `${x}deg`);
      element.style.setProperty("--tilt-y", `${y}deg`);
    };

    const onTiltMove = (event: Event) => {
      const target = event.currentTarget as HTMLElement;
      const pointer = event as PointerEvent;
      const rect = target.getBoundingClientRect();
      const px = (pointer.clientX - rect.left) / rect.width;
      const py = (pointer.clientY - rect.top) / rect.height;
      const tiltY = (px - 0.5) * 8;
      const tiltX = (0.5 - py) * 8;
      applyTilt(target, tiltX, tiltY);
    };

    const onTiltLeave = (event: Event) => {
      const target = event.currentTarget as HTMLElement;
      applyTilt(target, 0, 0);
    };

    const tiltElements = Array.from(document.querySelectorAll<HTMLElement>(".tilt-3d"));
    tiltElements.forEach((element) => {
      element.addEventListener("pointermove", onTiltMove, { passive: true });
      element.addEventListener("pointerleave", onTiltLeave, { passive: true });
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("focusin", onFocusIn, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
      tiltElements.forEach((element) => {
        element.removeEventListener("pointermove", onTiltMove);
        element.removeEventListener("pointerleave", onTiltLeave);
      });
      document.body.classList.remove("cursor-3d-enabled");
    };
  }, [trailIndexes]);

  return (
    <>
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[140] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-cyan-300/10 shadow-[0_0_28px_rgba(56,189,248,0.35)] backdrop-blur sm:block"
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[141] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.92)] sm:block"
        aria-hidden="true"
      />
      {trailIndexes.map((index) => (
        <div
          key={index}
          ref={(el) => {
            trailRefs.current[index] = el;
          }}
          className="pointer-events-none fixed left-0 top-0 z-[139] hidden h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/70 blur-[1px] sm:block"
          aria-hidden="true"
        />
      ))}
    </>
  );
}
