import { Card } from "@/components/ui/card";
import { features } from "@/data/dummy";

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-shell">
        <div className="animate-reveal flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
              Product intelligence built for career outcomes
            </h2>
            <p className="mt-2 max-w-2xl text-slate-700 dark:text-slate-200">
              Each module is designed to improve internship discovery, candidate quality, and hiring speed.
            </p>
          </div>
          <p className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700 dark:border-primary-500/40 dark:bg-primary-900/20 dark:text-primary-300">
            Core Capabilities
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <Card key={item.title} className="animate-reveal">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-300">Module {index + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.description}</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-primary-500 to-cyan-500" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
