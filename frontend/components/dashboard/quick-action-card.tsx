import Link from "next/link";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  href: string;
  title: string;
  description: string;
  meta?: string;
  className?: string;
};

export function QuickActionCard({ href, title, description, meta, className }: QuickActionCardProps) {
  return (
    <Link href={href} className={cn("group ds-card ds-surface--interactive flex h-full flex-col p-4", className)}>
      <p className="ds-h3">{title}</p>
      <p className="ds-caption mt-1 flex-1">{description}</p>
      {meta && <p className="ds-label mt-3">{meta}</p>}
      <p className="ds-caption mt-2 transition group-hover:text-[var(--ds-text)]">Open →</p>
    </Link>
  );
}
