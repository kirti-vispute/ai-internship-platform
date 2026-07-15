"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  SectionBlock,
  SectionHeading,
  EmbedPanel,
  HomeProgressBar,
  AiInsightBadge,
  HomeButton,
  TileText
} from "@/components/home/home-primitives";

const INSIGHTS = [
  { label: "ATS readiness", value: 87 },
  { label: "Technical depth", value: 78 },
  { label: "Recruiter signal", value: 91 }
] as const;

function ScoreRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div className="relative mx-auto inline-flex h-[100px] w-[100px] items-center justify-center">
      <svg width={100} height={100} className="-rotate-90" aria-hidden>
        <circle cx={50} cy={50} r={r} fill="none" strokeWidth={4} className="stroke-white/[0.1]" />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          className="stroke-internai-blue/80"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-internai-text">{clamped}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-internai-muted">Score</span>
      </div>
    </div>
  );
}

export function ResumeScoreHomeSection() {
  return (
    <SectionBlock id="resume-score" contentClassName="max-w-md mx-auto w-full">
      <ScrollReveal variant="fade-up" distance={6}>
        <SectionHeading
          eyebrow="Resume AI"
          title="Your resume score"
          description="One score. Three hiring signals."
        />
      </ScrollReveal>

      <ScrollReveal variant="fade-up" distance={5}>
        <EmbedPanel className="internai-embed-panel-padding text-center">
          <AiInsightBadge>Live analysis</AiInsightBadge>
          <div className="mt-4">
            <ScoreRing value={87} />
          </div>
          <TileText className="mt-2">Strong ATS alignment for internship pipelines.</TileText>
          <div className="mt-4 space-y-2.5 text-left">
            {INSIGHTS.map((item) => (
              <HomeProgressBar key={item.label} label={item.label} value={item.value} />
            ))}
          </div>
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <HomeButton href="/dashboard/intern/resume/score">Open full report</HomeButton>
          </div>
        </EmbedPanel>
      </ScrollReveal>
    </SectionBlock>
  );
}
