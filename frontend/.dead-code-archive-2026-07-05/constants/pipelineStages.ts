export const PIPELINE_STAGES = [
  "applied",
  "shortlisted",
  "under_review",
  "interview_scheduled",
  "technical_round",
  "hr_round",
  "selected",
  "rejected",
  "on_hold"
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];
