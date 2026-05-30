import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  cursorType?: "card" | "button" | "link";
};

export function TiltCard({ children, className, cursorType = "card" }: TiltCardProps) {
  return (
    <div
      data-cursor={cursorType}
      className={cn(
        "tilt-3d relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(15,23,42,0.16)] dark:border-slate-700/70 dark:bg-slate-900/80 dark:shadow-[0_16px_36px_rgba(2,6,23,0.55)] dark:hover:shadow-[0_22px_46px_rgba(2,6,23,0.65)]",
        className
      )}
    >
      {children}
    </div>
  );
}

