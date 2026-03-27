import { whyChoose } from "@/data/dummy";

export function WhyChooseSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft dark:border-slate-700 dark:bg-slate-900/80 sm:p-8">
        <h2 className="text-3xl font-black tracking-tight text-ink dark:text-slate-100 sm:text-4xl">Why Choose InternAI</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">A focused experience for internship growth and company hiring excellence.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {whyChoose.map((reason, index) => (
            <div
              key={reason}
              className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-sm text-slate-700 transition duration-300 hover:-translate-y-1 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:text-slate-200"
            >
              <p className="mb-2 inline-flex rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
                Point {index + 1}
              </p>
              {reason}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
