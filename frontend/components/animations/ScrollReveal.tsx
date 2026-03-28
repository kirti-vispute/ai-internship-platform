"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealVariant =
  | "fade-up"
  | "soft-scale"
  | "stagger-children"
  | "slide-left"
  | "slide-right"
  | "blur-up"
  | "zoom-in"
  | "clip-reveal"
  | "tilt-rise";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  distance?: number;
  variant?: RevealVariant;
  threshold?: number;
  once?: boolean;
  staggerMs?: number;
};

export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  distance = 14,
  variant = "fade-up",
  threshold = 0.16,
  once = true,
  staggerMs = 85
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once, threshold]);

  useEffect(() => {
    if (variant !== "stagger-children") return;
    const element = ref.current;
    if (!element) return;

    const items = Array.from(element.children) as HTMLElement[];
    items.forEach((child, index) => {
      child.style.transitionDelay = visible ? `${delayMs + index * staggerMs}ms` : "0ms";
      child.style.transform = visible ? "translateY(0) scale(1)" : `translateY(${Math.max(distance - 4, 6)}px) scale(0.98)`;
      child.style.opacity = visible ? "1" : "0";
      child.style.filter = visible ? "blur(0px)" : "blur(6px)";
      child.style.transitionProperty = "opacity, transform, filter";
      child.style.transitionDuration = "760ms";
      child.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)";
    });
  }, [delayMs, distance, staggerMs, variant, visible]);

  let variantClass = "";
  let transform = visible ? "translateY(0) scale(1)" : `translateY(${distance}px) scale(1)`;
  let filter = "blur(0px)";
  let clipPath: string | undefined;

  if (variant === "stagger-children") {
    variantClass = "";
  } else if (variant === "soft-scale") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.985)";
  } else if (variant === "slide-left") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateX(0) scale(1)" : `translateX(-${distance}px) scale(0.995)`;
  } else if (variant === "slide-right") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateX(0) scale(1)" : `translateX(${distance}px) scale(0.995)`;
  } else if (variant === "blur-up") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateY(0) scale(1)" : `translateY(${distance}px) scale(0.985)`;
    filter = visible ? "blur(0px)" : "blur(9px)";
  } else if (variant === "zoom-in") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateY(0) scale(1)" : "translateY(4px) scale(0.94)";
    filter = visible ? "blur(0px)" : "blur(4px)";
  } else if (variant === "clip-reveal") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateY(0) scale(1)" : `translateY(${Math.max(distance - 3, 8)}px) scale(0.992)`;
    filter = visible ? "blur(0px)" : "blur(6px)";
    clipPath = visible ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)";
  } else if (variant === "tilt-rise") {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "perspective(1200px) rotateX(0deg) translateY(0)" : `perspective(1200px) rotateX(8deg) translateY(${distance}px)`;
    filter = visible ? "blur(0px)" : "blur(4px)";
  } else {
    variantClass = visible ? "opacity-100" : "opacity-0";
    transform = visible ? "translateY(0) scale(1)" : `translateY(${distance}px) scale(1)`;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform",
        variant !== "stagger-children" && "transition-all duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        variantClass,
        className
      )}
      style={variant !== "stagger-children" ? { transitionDelay: `${delayMs}ms`, transform, filter, clipPath } : undefined}
    >
      {children}
    </div>
  );
}
