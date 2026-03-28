import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
};

const baseClasses =
  "tilt-3d inline-flex items-center justify-center rounded-xl font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]";

const variants = {
  primary:
    "bg-gradient-to-r from-primary-500 to-blue-500 text-white shadow-glow hover:from-primary-600 hover:to-blue-600 hover:-translate-y-0.5 dark:from-primary-600 dark:to-cyan-500 dark:hover:from-primary-500 dark:hover:to-cyan-400",
  secondary:
    "border border-slate-200 bg-white text-slate-900 shadow-soft hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base"
};

export function Button({ className, variant = "primary", size = "md", href, children, ...props }: ButtonProps) {
  const finalClassName = cn(baseClasses, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={finalClassName} data-cursor="button">
        {children}
      </Link>
    );
  }

  return (
    <button className={finalClassName} data-cursor="button" {...props}>
      {children}
    </button>
  );
}
