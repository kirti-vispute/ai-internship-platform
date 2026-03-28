"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  return (
    <ScrollReveal className={className} delayMs={delayMs} variant="fade-up" distance={14}>
      {children}
    </ScrollReveal>
  );
}
