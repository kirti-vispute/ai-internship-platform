import { memo } from "react";
import { cn } from "@/lib/utils";

type SkillChipsProps = {
  skills: string[];
  /** Use on dark surfaces (profile panels) for stronger chip contrast */
  variant?: "default" | "elevated";
};

const chipBase =
  "skill-chip rounded-full border px-3 py-1 text-xs font-semibold shadow-soft transition-all duration-200 hover:-translate-y-0.5";

const chipVariants = {
  default:
    "border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] text-[var(--ds-text)] hover:border-[var(--ds-accent)] hover:text-[var(--ds-accent-strong)] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-primary-500/70 dark:hover:text-primary-200",
  elevated:
    "border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] text-[var(--ds-text)] hover:border-cyan-500/60 hover:bg-[rgba(40,54,74,0.98)] hover:text-[var(--ds-accent-strong)] dark:border-slate-500 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-cyan-500/60 dark:hover:text-cyan-200"
};

function SkillChipsComponent({ skills, variant = "default" }: SkillChipsProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-sm text-[var(--ds-text-secondary)]">No skills extracted yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span key={skill} className={cn(chipBase, chipVariants[variant])}>
          {skill}
        </span>
      ))}
    </div>
  );
}

export const SkillChips = memo(SkillChipsComponent);
