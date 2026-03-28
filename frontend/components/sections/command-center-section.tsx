import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CommandCenterPanel } from "@/components/home/CommandCenterPanel";

export function CommandCenterSection() {
  return (
    <section className="pb-12 pt-6 sm:pb-16 sm:pt-10">
      <div className="container-shell">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-[0_20px_50px_rgba(2,6,23,0.55)] sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/15" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/15" />

          <ScrollReveal className="relative z-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-300">AI Internship Command Center</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">Live Hiring Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Actionable intelligence for resume quality, skill readiness, and verified hiring workflows without cluttering the hero experience.
            </p>
          </ScrollReveal>

          <div className="relative z-10 mt-6">
            <CommandCenterPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

