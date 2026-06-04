"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { cn } from "@/lib/utils";

const HERO_REFERENCE_IMAGE = "/hero-reference-2.png";

const HERO_LINES = [
  "Career acceleration for interns.",
  "Smarter hiring for companies.",
  "Enterprise-ready placement system."
] as const;

export function HeroSection() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 8]);
  const imageY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, -6]);

  return (
    <section ref={sectionRef} className="internai-hero-zone">
      <div className="internai-hero-grid">
        <ScrollReveal variant="fade-up" distance={8} className="internai-hero-copy flex flex-col justify-center">
          <motion.div style={{ y: textY }}>
            <div className="relative">
              <div className="internai-hero-title-aura" aria-hidden />
              <h1 className="internai-heading-display internai-hero-glow">InternAI</h1>
            </div>
            <div className="mt-4 space-y-1.5">
              {HERO_LINES.map((line, i) => (
                <p
                  key={line}
                  className={cn(
                    "text-[15px] leading-snug sm:text-base",
                    i === 0 ? "font-semibold text-internai-text" : "text-internai-muted"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link href="/auth/intern" className="internai-btn-primary">
                Start as Intern
              </Link>
              <Link href="/auth/company" className="internai-btn-secondary">
                Hire with InternAI
              </Link>
            </div>
          </motion.div>
        </ScrollReveal>

        <ScrollReveal variant="fade-up" distance={6} delayMs={40} className="internai-hero-visual">
          <motion.div style={{ y: imageY }} className="relative h-full min-h-[inherit] w-full">
            <img
              src={HERO_REFERENCE_IMAGE}
              alt="AI internship workflow reference"
              className="absolute inset-0 h-full w-full object-contain object-center"
            />
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}
