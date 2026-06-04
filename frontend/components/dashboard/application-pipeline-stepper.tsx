import { cn } from "@/lib/utils";

const PIPELINE_STEPS = [
  { key: "applied", label: "Applied" },
  { key: "under_review", label: "Under Review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "technical_round", label: "Technical" },
  { key: "hr_round", label: "HR Round" },
  { key: "selected", label: "Selected" }
] as const;

function normalizeStatus(status: string) {
  const value = String(status || "").toLowerCase();
  if (value === "screening" || value === "reviewed") return "under_review";
  if (value === "interview" || value === "interview_completed") return "interview_scheduled";
  if (value === "offered") return "selected";
  return value;
}

type ApplicationPipelineStepperProps = {
  status: string;
  compact?: boolean;
};

export function ApplicationPipelineStepper({ status, compact = false }: ApplicationPipelineStepperProps) {
  const normalized = normalizeStatus(status);
  const isRejected = normalized === "rejected" || normalized === "withdrawn";
  const activeIdx = PIPELINE_STEPS.findIndex((step) => step.key === normalized);
  const resolvedIdx = activeIdx >= 0 ? activeIdx : 0;

  if (isRejected) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
        {normalized === "withdrawn" ? "Application Withdrawn" : "Application Rejected"}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7")}>
      {PIPELINE_STEPS.map((step, idx) => {
        const done = idx <= resolvedIdx;
        return (
          <div
            key={step.key}
            className={cn(
              "rounded-lg border px-2 py-2 text-center text-[11px] font-medium leading-tight",
              done
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            )}
          >
            {step.label}
          </div>
        );
      })}
    </div>
  );
}
