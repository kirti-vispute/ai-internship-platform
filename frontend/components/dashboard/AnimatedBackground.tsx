import { cn } from "@/lib/utils";

type AnimatedBackgroundProps = {
  className?: string;
};

export function AnimatedBackground({ className }: AnimatedBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute -top-32 left-[8%] h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl animate-pulse-slow dark:bg-cyan-300/10" />
      <div className="absolute right-[6%] top-24 h-64 w-64 rounded-full bg-indigo-400/8 blur-3xl animate-pulse-slow [animation-delay:1.2s] dark:bg-indigo-300/12" />
      <div className="absolute bottom-4 left-1/3 h-56 w-56 rounded-full bg-blue-400/8 blur-3xl animate-pulse-slow [animation-delay:2.2s] dark:bg-blue-300/10" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:34px_34px] dark:bg-[linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)]" />

      <div className="absolute -left-10 top-1/4 h-px w-64 bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent animate-signal-slide" />
      <div className="absolute right-0 top-[58%] h-px w-72 bg-gradient-to-r from-transparent via-blue-400/45 to-transparent animate-signal-slide [animation-delay:1.35s]" />
    </div>
  );
}

