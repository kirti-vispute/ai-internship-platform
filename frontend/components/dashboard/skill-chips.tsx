import { memo } from "react";
import { cn } from "@/lib/utils";

type SkillChipsProps = {
  skills: string[];
  /** Use on dark surfaces (profile panels) for stronger chip contrast */
  variant?: "default" | "elevated";
};

const chipBase =
  "rounded-full border px-3 py-1 text-xs font-semibold shadow-soft transition-all duration-200 hover:-translate-y-0.5";

const chipVariants = {
  default:
    "border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:hover:border-primary-500/70 dark:hover:bg-primary-950/50 dark:hover:text-primary-200",
  elevated:
    "border-slate-300 bg-slate-50 text-slate-900 hover:border-primary-400 hover:bg-primary-100 hover:text-primary-900 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-50 dark:hover:border-cyan-500/60 dark:hover:bg-slate-900 dark:hover:text-cyan-200"
};

function SkillChipsComponent({ skills, variant = "default" }: SkillChipsProps) {
  if (!skills || skills.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No skills extracted yet.</p>;
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
