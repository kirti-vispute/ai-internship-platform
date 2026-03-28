"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "fade-up" | "soft-scale" | "stagger-children";

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
      child.style.transitionProperty = "opacity, transform";
      child.style.transitionDuration = "700ms";
      child.style.transitionTimingFunction = "cubic-bezier(0.22, 1, 0.36, 1)";
    });
  }, [delayMs, distance, staggerMs, variant, visible]);

  const variantClass =
    variant === "soft-scale"
      ? visible
        ? "translate-y-0 scale-100 opacity-100"
        : "translate-y-1 scale-[0.985] opacity-0"
      : variant === "stagger-children"
        ? ""
        : visible
          ? "translate-y-0 opacity-100"
          : "opacity-0";

  return (
    <div
      ref={ref}
      className={cn(
        "will-change-transform",
        variant !== "stagger-children" && "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        variantClass,
        className
      )}
      style={variant !== "stagger-children" ? { transitionDelay: `${delayMs}ms`, transform: visible ? "translateY(0)" : `translateY(${distance}px)` } : undefined}
    >
      {children}
    </div>
  );
}

