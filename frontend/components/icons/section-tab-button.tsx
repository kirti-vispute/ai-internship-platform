import type { LucideIcon } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type SectionTabButtonProps = {
  label: string;
  active: boolean;
  icon?: LucideIcon;
  onClick: () => void;
};

export function SectionTabButton({ label, active, icon, onClick }: SectionTabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
          : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {icon ? <AppIcon icon={icon} size="xs" className={active ? "text-primary-600 dark:text-primary-300" : undefined} /> : null}
      {label}
    </button>
  );
}
