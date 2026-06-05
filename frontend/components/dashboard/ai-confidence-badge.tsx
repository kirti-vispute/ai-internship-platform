"use client";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import type { ConfidenceTier, ValidationStatus } from "@/lib/ai-platform/types";
import { cn } from "@/lib/utils";

type Props = {
  confidenceScore: number;
  validationStatus: ValidationStatus;
  confidenceTier?: ConfidenceTier;
  explanationTrace?: string;
  compact?: boolean;
  className?: string;
};

const TIER_STYLES: Record<ConfidenceTier, string> = {
  high: "border-emerald-200/70 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200",
  medium: "border-amber-200/70 bg-amber-50/50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
  low: "border-rose-200/70 bg-rose-50/50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
};

const STATUS_ICON = {
  validated: CheckCircle2,
  partial: Shield,
  conflict_detected: AlertTriangle
} as const;

export function AiConfidenceBadge({
  confidenceScore,
  validationStatus,
  confidenceTier,
  explanationTrace,
  compact = false,
  className
}: Props) {
  const tier: ConfidenceTier =
    confidenceTier ?? (confidenceScore >= 85 ? "high" : confidenceScore >= 60 ? "medium" : "low");
  const Icon = STATUS_ICON[validationStatus];

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
          TIER_STYLES[tier],
          className
        )}
        title={explanationTrace}
      >
        <AppIcon icon={Icon} size="xs" />
        AI {confidenceScore}%
      </span>
    );
  }

  return (
    <div className={cn("rounded-lg border px-3 py-2", TIER_STYLES[tier], className)}>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <AppIcon icon={Icon} size="xs" />
        <span>
          AI Confidence {confidenceScore}% · {validationStatus.replace(/_/g, " ")}
        </span>
      </div>
      {explanationTrace && tier === "low" ? (
        <p className="mt-1 text-[11px] opacity-90">{explanationTrace}</p>
      ) : null}
      {tier === "low" ? (
        <p className="mt-1 text-[11px] font-medium">Low confidence — treat as partial analysis only.</p>
      ) : null}
    </div>
  );
}
