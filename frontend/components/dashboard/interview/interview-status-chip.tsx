"use client";

import { interviewStatusMeta, type InterviewDisplayStatus } from "@/lib/interview-workflow";
import { cn } from "@/lib/utils";

type InterviewStatusChipProps = {
  status: InterviewDisplayStatus;
  className?: string;
};

export function InterviewStatusChip({ status, className }: InterviewStatusChipProps) {
  const meta = interviewStatusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        meta.className,
        className
      )}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
    </span>
  );
}
