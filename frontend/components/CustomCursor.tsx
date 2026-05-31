"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const INTERACTIVE_SELECTOR = "a, button, [role='button'], [data-cursor]";
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

export function CustomCursor() {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/auth");

  const ringRef = useRef<HTMLDivElement | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const wideEnough = window.matchMedia("(min-width: 640px)").matches;
    if (!finePointer || !wideEnough || isAuthRoute) {
      document.body.classList.remove("cursor-3d-enabled");
      return;
    }

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.body.classList.add("cursor-3d-enabled");

    let hoverState: "default" | "link" | "button" | "card" | "text" = "default";

    const positionAt = (x: number, y: number, extra = "") =>
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)${extra}`;

    const applyHoverStyles = () => {
      let scale = 1;
      let ringOpacity = 0.7;
      let ringColor = "rgba(56,189,248,0.7)";

      if (hoverState === "link") {
        scale = 1.25;
        ringOpacity = 0.9;
      } else if (hoverState === "button") {
        scale = 1.4;
        ringOpacity = 0.95;
        ringColor = "rgba(99,102,241,0.78)";
      } else if (hoverState === "card") {
        scale = 1.2;
        ringOpacity = 0.85;
      } else if (hoverState === "text") {
        ringOpacity = 0;
      }

      ring.style.opacity = String(ringOpacity);
      ring.style.borderColor = ringColor;
      dot.style.opacity = hoverState === "text" ? "0" : "1";
      ring.dataset.scale = String(scale);
    };

    const setHoverState = (target: HTMLElement | null) => {
      if (!target) {
        hoverState = "default";
        applyHoverStyles();
        return;
      }

      if (target.closest(TEXT_SELECTOR)) {
        hoverState = "text";
        applyHoverStyles();
        return;
      }

      const interactive = target.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
      if (!interactive) {
        hoverState = "default";
        applyHoverStyles();
        return;
      }

      const explicit = interactive.dataset.cursor;
      if (explicit === "card" || explicit === "button" || explicit === "link") {
        hoverState = explicit;
      } else {
        hoverState = interactive.tagName.toLowerCase() === "a" ? "link" : "button";
      }
      applyHoverStyles();
    };

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;
      const scale = Number(ring.dataset.scale || "1");

      dot.style.transform = positionAt(x, y);
      ring.style.transform = positionAt(x, y, ` scale(${scale})`);
      setHoverState(event.target as HTMLElement | null);
    };

    const onFocusIn = (event: FocusEvent) => {
      setHoverState(event.target as HTMLElement | null);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("focusin", onFocusIn, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("focusin", onFocusIn);
      document.body.classList.remove("cursor-3d-enabled");
    };
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <div
        ref={ringRef}
        data-scale="1"
        className="pointer-events-none fixed left-0 top-0 z-[140] hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/70 bg-cyan-300/10 sm:block"
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[141] hidden h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 sm:block"
        aria-hidden="true"
      />
    </>
  );
}
