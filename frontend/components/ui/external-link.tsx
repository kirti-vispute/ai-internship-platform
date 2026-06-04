import type { LucideIcon } from "lucide-react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  showIcon?: boolean;
};

/** High-contrast external URL — cyan accent + underline (not primary blue). */
export function ExternalLink({ href, children, className, icon, showIcon = true }: ExternalLinkProps) {
  const Icon = icon || ExternalLinkIcon;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn("text-link", className)}
    >
      <span>{children}</span>
      {showIcon ? <AppIcon icon={Icon} size="xs" className="shrink-0 opacity-90" aria-hidden /> : null}
    </a>
  );
}
