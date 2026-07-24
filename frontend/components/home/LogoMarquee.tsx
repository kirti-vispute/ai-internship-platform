"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { cn } from "@/lib/utils";

const DEFAULT_LOGOS = [
  "NovaTech",
  "Acme Labs",
  "OrbitWorks",
  "PixelForge",
  "CloudNest",
  "DataSpring",
  "SkillBridge",
  "HireFlow",
  "TalentGrid",
  "NextHire"
];

type LogoMarqueeProps = {
  logos?: string[];
  className?: string;
  tone?: "light" | "dark";
};

export function LogoMarquee({ logos = DEFAULT_LOGOS, className, tone = "light" }: LogoMarqueeProps) {
  const isDark = tone === "dark";
  const track = [...logos, ...logos];

  return (
    <ScrollReveal variant="fade-up" distance={10} className={cn("mt-8", className)}>
      <p
        className={cn(
          "mb-4 text-center text-xs font-semibold uppercase tracking-[0.2em]",
          isDark ? "text-internai-muted" : "text-[var(--ds-muted)]"
        )}
      >
        Trusted by hiring teams
      </p>
      <div
        className={cn(
          "logo-marquee-mask relative overflow-hidden rounded-2xl border py-4",
          isDark
            ? "border-white/[0.06] bg-internai-surface/60"
            : "border-[var(--ds-border)] bg-[var(--ds-card)]/50"
        )}
      >
        <div className="logo-marquee-track flex w-max items-center gap-10 px-6">
          {track.map((name, index) => (
            <span
              key={`${name}-${index}`}
              className={cn(
                "shrink-0 text-sm font-semibold tracking-wide transition-colors duration-300",
                isDark
                  ? "text-internai-muted hover:text-internai-blue"
                  : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-primary)]"
              )}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
