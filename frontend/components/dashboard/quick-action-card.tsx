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
    <Link
      href={href}
      className={cn(
        "group surface-subtle flex h-full flex-col p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary-500/40",
        className
      )}
    >
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>
      {meta && <p className="mt-3 text-xs font-semibold text-primary-600 dark:text-primary-300">{meta}</p>}
      <p className="mt-2 text-xs font-semibold text-slate-500 transition group-hover:text-primary-600 dark:group-hover:text-primary-300">
        Open →
      </p>
    </Link>
  );
}
