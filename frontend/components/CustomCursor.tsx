"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], [data-cursor]";
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

export function CustomCursor() {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);
  const trailIndexes = useMemo(() => [0, 1, 2], []);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer || isAuthRoute) {
      document.body.classList.remove("cursor-3d-enabled");
      return;
    }

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
    let activeTiltElement: HTMLElement | null = null;
    let animationFrame = 0;
    let pointerFrame = 0;

    let queuedX = mouse.x;
    let queuedY = mouse.y;
    let queuedTarget: HTMLElement | null = null;

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

    const applyTilt = (target: HTMLElement | null, x: number, y: number) => {
      const tiltCandidate = target?.closest?.(".tilt-3d") as HTMLElement | null;

      if (activeTiltElement && activeTiltElement !== tiltCandidate) {
        activeTiltElement.style.setProperty("--tilt-x", "0deg");
        activeTiltElement.style.setProperty("--tilt-y", "0deg");
      }

      if (!tiltCandidate) {
        activeTiltElement = null;
        return;
      }

      const rect = tiltCandidate.getBoundingClientRect();
      const px = (x - rect.left) / Math.max(rect.width, 1);
      const py = (y - rect.top) / Math.max(rect.height, 1);
      const tiltY = (px - 0.5) * 8;
      const tiltX = (0.5 - py) * 8;
      tiltCandidate.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      tiltCandidate.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
      activeTiltElement = tiltCandidate;
    };

    const flushPointerFrame = () => {
      pointerFrame = 0;
      mouse.x = queuedX;
      mouse.y = queuedY;
      setHoverState(queuedTarget);
      applyTilt(queuedTarget, queuedX, queuedY);
    };

    const onPointerMove = (event: PointerEvent) => {
      queuedX = event.clientX;
      queuedY = event.clientY;
      queuedTarget = event.target as HTMLElement | null;

      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(flushPointerFrame);
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
        targetX += (centerX - mouse.x) * 0.14;
        targetY += (centerY - mouse.y) * 0.14;
      }

      dotPos.x += (targetX - dotPos.x) * 0.3;
      dotPos.y += (targetY - dotPos.y) * 0.3;
      ringPos.x += (targetX - ringPos.x) * 0.14;
      ringPos.y += (targetY - ringPos.y) * 0.14;

      dot.style.transform = `translate3d(${dotPos.x}px, ${dotPos.y}px, 0)`;

      let scale = 1;
      let ringOpacity = 0.7;
      let ringColor = "rgba(56,189,248,0.7)";
      if (hoverState === "link") {
        scale = 1.35;
        ringOpacity = 0.92;
      } else if (hoverState === "button") {
        scale = 1.6;
        ringOpacity = 0.96;
        ringColor = "rgba(99,102,241,0.78)";
      } else if (hoverState === "card") {
        scale = 1.25;
        ringOpacity = 0.86;
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
        const followStrength = Math.max(0.14, 0.22 - index * 0.03);
        trailPos[index].x += (lead.x - trailPos[index].x) * followStrength;
        trailPos[index].y += (lead.y - trailPos[index].y) * followStrength;
        trail.style.transform = `translate3d(${trailPos[index].x}px, ${trailPos[index].y}px, 0) scale(${1 - index * 0.15})`;
        trail.style.opacity = hoverState === "text" ? "0" : `${0.3 - index * 0.07}`;
      });

      animationFrame = window.requestAnimationFrame(animate);
    };
    animate();

    const resetTiltState = () => {
      if (!activeTiltElement) return;
      activeTiltElement.style.setProperty("--tilt-x", "0deg");
      activeTiltElement.style.setProperty("--tilt-y", "0deg");
      activeTiltElement = null;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", resetTiltState, { passive: true });
    document.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("focusin", onFocusIn, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", resetTiltState);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("focusin", onFocusIn);
      resetTiltState();
      document.body.classList.remove("cursor-3d-enabled");
    };
  }, [isAuthRoute, trailIndexes]);

  if (isAuthRoute) {
    return null;
  }

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
          className="pointer-events-none fixed left-0 top-0 z-[139] hidden h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/70 blur-[1px] sm:block"
          aria-hidden="true"
        />
      ))}
    </>
  );
}
