"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { WallSection, HomeButton } from "@/components/home/home-primitives";

export function FinalCtaSection() {
  return (
    <WallSection variant="cta" contentClassName="max-w-lg mx-auto w-full text-center">
      <ScrollReveal variant="fade-up" distance={6}>
        <p className="internai-eyebrow">Get started</p>
        <h2 className="internai-heading-section mt-1.5">Launch your AI-powered career</h2>
        <p className="internai-body mx-auto mt-1 max-w-sm">
          Join interns and companies on one intelligent placement layer.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          <HomeButton href="/auth/intern">Join as Intern</HomeButton>
          <HomeButton href="/auth/company" variant="secondary">
            Join as Company
          </HomeButton>
        </div>
      </ScrollReveal>
    </WallSection>
  );
}
