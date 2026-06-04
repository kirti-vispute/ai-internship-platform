"use client";

import { ArrowRight, BookOpen } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  SectionBlock,
  SectionHeading,
  AiInsightBadge,
  HomeButton,
  EmbedPanel,
  EmbedRow,
  TileTitle,
  TileText
} from "@/components/home/home-primitives";

const GAPS = [
  { skill: "System design", action: "Add one architecture case study." },
  { skill: "TypeScript", action: "Ship a typed full-stack feature." },
  { skill: "Cloud deploy", action: "Deploy with a minimal CI pipeline." }
] as const;

const LEARNING_PATH = ["Full-Stack Foundations", "TypeScript sprint", "Cloud deploy lab"] as const;

export function SkillGapHomeSection() {
  return (
    <SectionBlock id="skill-gap" contentClassName="max-w-3xl mx-auto w-full">
      <ScrollReveal variant="fade-up" distance={6}>
        <SectionHeading
          eyebrow="Skill coach"
          title="Close gaps with AI"
          description="Priority skills and a focused learning path."
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" distance={5}>
        <EmbedPanel className="internai-embed-panel-padding">
          <div className="grid gap-4 md:grid-cols-5 md:gap-5">
            <div className="md:col-span-3">
              {GAPS.map((gap) => (
                <EmbedRow key={gap.skill}>
                  <AiInsightBadge>Gap</AiInsightBadge>
                  <TileTitle className="mt-1">{gap.skill}</TileTitle>
                  <TileText className="mt-0.5">{gap.action}</TileText>
                </EmbedRow>
              ))}
            </div>

            <div className="internai-embed-inset flex flex-col p-4 md:col-span-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-internai-cyan" strokeWidth={1.75} aria-hidden />
                <TileTitle>Learning path</TileTitle>
              </div>
              <ol className="mt-3 space-y-2">
                {LEARNING_PATH.map((step, i) => (
                  <li key={step} className="flex items-center gap-2.5 text-[13px] font-medium text-internai-muted">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[rgba(12,18,32,0.9)] text-[10px] font-semibold text-internai-cyan">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-4 flex justify-center border-t border-white/[0.06] pt-4">
            <HomeButton href="/dashboard/intern/skill-gap" variant="secondary" className="gap-2">
              Open skill coach
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </HomeButton>
          </div>
        </EmbedPanel>
      </ScrollReveal>
    </SectionBlock>
  );
}
