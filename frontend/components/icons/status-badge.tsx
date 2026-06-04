import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Ban,
  CircleDashed,
  Clock,
  Flag,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  Video
} from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type StatusConfig = {
  className: string;
  icon: LucideIcon;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  applied: { className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: CircleDashed },
  under_review: { className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  shortlisted: { className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300", icon: Sparkles },
  interview_scheduled: { className: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", icon: Video },
  technical_round: { className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: MessageSquare },
  hr_round: { className: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300", icon: UserCheck },
  selected: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: BadgeCheck },
  offered: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: BadgeCheck },
  rejected: { className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", icon: UserX },
  withdrawn: { className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: Ban },
  verified: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: ShieldCheck },
  pending: { className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Clock },
  suspended: { className: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: Ban },
  open: { className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", icon: Flag },
  in_review: { className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
  escalated: { className: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", icon: Flag },
  resolved: { className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: BadgeCheck },
  dismissed: { className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: Ban },
  admin: { className: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300", icon: ShieldCheck },
  company: { className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: ShieldCheck },
  intern: { className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", icon: UserCheck },
  reported: { className: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", icon: Flag }
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_MAP[normalized] || {
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    icon: CircleDashed
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        config.className,
        className
      )}
    >
      <AppIcon icon={config.icon} size="xs" className="text-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
