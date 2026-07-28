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
  high: "border-[var(--ds-success)] bg-[var(--ds-success-bg)] text-[var(--ds-success)]",
  medium: "border-[var(--ds-warning)] bg-[var(--ds-warning-bg)] text-[var(--ds-warning)]",
  low: "border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] text-[var(--ds-danger)]"
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
        aria-label={explanationTrace ? `AI confidence ${confidenceScore} percent. ${explanationTrace}` : `AI confidence ${confidenceScore} percent`}
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
