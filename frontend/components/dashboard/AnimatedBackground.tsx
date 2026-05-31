import { cn } from "@/lib/utils";

type AnimatedBackgroundProps = {
  className?: string;
};

export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute -top-32 left-[8%] h-72 w-72 rounded-full bg-cyan-400/6 dark:bg-cyan-300/8" />
      <div className="absolute right-[6%] top-24 h-64 w-64 rounded-full bg-indigo-400/6 dark:bg-indigo-300/8" />
      <div className="absolute bottom-4 left-1/3 h-56 w-56 rounded-full bg-blue-400/6 dark:bg-blue-300/8" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:34px_34px]" />
    </div>
  );
}
