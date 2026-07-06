"use client";

import { BarChart3, Brain, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  EmbedCell,
  EmbedMatrix,
  SectionBlock,
  SectionHeading,
  TileIcon,
  TileText,
  TileTitle
} from "@/components/home/home-primitives";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Sparkles, title: "AI Match Engine", description: "Rank roles from resume and skill signals." },
  { icon: Brain, title: "Resume Intelligence", description: "ATS score and gap insights in one view." },
  { icon: ShieldCheck, title: "Verified Hiring", description: "Trusted pipelines with clear stages." },
  { icon: BarChart3, title: "Live Pipeline", description: "Track applications and feedback end-to-end." }
];

export function FeaturesSection() {
  return (
    <SectionBlock id="features">
      <ScrollReveal variant="fade-up" distance={6}>
        <SectionHeading
          eyebrow="Platform"
          title="Built for modern placement"
          description="Four core capabilities for interns and hiring teams."
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" distance={5}>
        <EmbedMatrix cols={4}>
          {FEATURES.map((item) => (
            <EmbedCell key={item.title}>
              <TileIcon icon={item.icon} />
              <TileTitle className="mt-2.5">{item.title}</TileTitle>
              <TileText className="mt-1">{item.description}</TileText>
            </EmbedCell>
          ))}
        </EmbedMatrix>
      </ScrollReveal>
    </SectionBlock>
  );
}
