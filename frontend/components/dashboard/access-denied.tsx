import { Lock } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { cn } from "@/lib/utils";

type AccessDeniedProps = {
  title?: string;
  hint?: string;
  className?: string;
};

export function AccessDenied({
  title = "Access Denied",
  hint = "You don't have permission to view this module. Contact your Company Admin to request access.",
  className
}: AccessDeniedProps) {
  return (
    <ScrollReveal variant="fade-up" distance={8}>
      <div className={cn("ds-card border-dashed px-6 py-12 text-center", className)}>
        <div className="ds-stat-icon mx-auto mb-4 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
          <AppIcon icon={Lock} size="lg" />
        </div>
        <p className="ds-h3">{title}</p>
        <p className="ds-caption mx-auto mt-1 max-w-sm">{hint}</p>
      </div>
    </ScrollReveal>
  );
}
