"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SectionHeading, SectionShell } from "@/components/home/home-primitives";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Build Profile", description: "Create your intern profile with education, projects, and career interests." },
  { title: "Resume Score", description: "AI evaluates ATS readiness, skill strength, and improvement opportunities." },
  { title: "Apply", description: "Submit to verified internships ranked by fit and hiring confidence." },
  { title: "Interview", description: "Track interview rounds, feedback, and recruiter communication in one place." },
  { title: "Selection", description: "Move through shortlist and offer stages with transparent pipeline visibility." }
] as const;

function JourneyStep({ index, step }: { index: number; step: (typeof steps)[number] }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const active = useInView(ref, { once: false, amount: 0.55, margin: "0px 0px -10% 0px" });

  return (
    <motion.article
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0.7, y: 8 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.5 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "internai-card flex h-full min-h-[200px] flex-col p-5 transition duration-500",
        active && "border-internai-blue/35 shadow-[0_24px_48px_rgba(79,156,255,0.14)] ring-1 ring-internai-blue/20"
      )}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-internai-blue/40 bg-internai-blue/10 text-sm font-bold text-internai-blue">
        {index + 1}
      </span>
      <h3 className="mt-4 text-base font-bold text-internai-text">{step.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-internai-muted">{step.description}</p>
    </motion.article>
  );
}

export function HowItWorksSection() {
  return (
    <SectionShell id="how-it-works">
      <ScrollReveal variant="slide-left" distance={16}>
        <SectionHeading
          eyebrow="Journey"
          title="How it works"
          description="Student journey from profile building to final selection — guided, measurable, and recruiter-ready."
        />
      </ScrollReveal>

      <div className="relative mt-10">
        <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-internai-blue/40 to-transparent lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <ScrollReveal key={step.title} variant="fade-up" delayMs={index * 55} distance={12} className="h-full">
              <JourneyStep index={index} step={step} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
