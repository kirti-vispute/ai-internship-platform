"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ScheduledInterviewRecord } from "@/lib/interview-workflow";
import { getInterviewJoinAvailability, formatInterviewJoinHint } from "@/lib/interview-join";

type InterviewJoinButtonProps = {
  interview: ScheduledInterviewRecord;
  size?: "sm" | "md";
  className?: string;
};

export function InterviewJoinButton({ interview, size = "sm", className }: InterviewJoinButtonProps) {
  const { joinHref, canJoin, isExternalLink } = getInterviewJoinAvailability(interview);
  const hint = formatInterviewJoinHint(interview);

  if (!joinHref) return null;

  if (!canJoin) {
    if (!hint) return null;
    return <p className={`text-xs text-slate-500 dark:text-slate-400 ${className || ""}`}>{hint}</p>;
  }

  if (isExternalLink) {
    return (
      <a
        href={joinHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:from-primary-600 hover:to-blue-600 ${className || ""}`}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Join Interview
      </a>
    );
  }

  return (
    <Button type="button" size={size} href={joinHref} className={className}>
      <ExternalLink className="h-3.5 w-3.5" />
      Join Interview
    </Button>
  );
}
