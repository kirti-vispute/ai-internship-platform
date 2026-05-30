"use client";

import { ParallaxSection } from "@/components/animations/ParallaxSection";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { cn } from "@/lib/utils";

type SectionAnimatorProps = {
  children: React.ReactNode;
  className?: string;
  revealVariant?: "fade-up" | "soft-scale" | "slide-left" | "slide-right" | "blur-up" | "zoom-in" | "clip-reveal" | "tilt-rise";
  delayMs?: number;
  distance?: number;
  threshold?: number;
  parallax?: number;
};

export function SectionAnimator({
  children,
  className,
  revealVariant = "fade-up",
  delayMs = 0,
  distance = 14,
  threshold = 0.16,
  parallax = 0
}: SectionAnimatorProps) {
  const content = (
    <ScrollReveal variant={revealVariant} delayMs={delayMs} distance={distance} threshold={threshold}>
      {children}
    </ScrollReveal>
  );

  if (parallax > 0) {
    return (
      <ParallaxSection intensity={parallax} className={cn(className)}>
        {content}
      </ParallaxSection>
    );
  }

  return <div className={cn(className)}>{content}</div>;
}
