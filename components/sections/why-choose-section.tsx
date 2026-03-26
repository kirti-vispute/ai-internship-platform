import { whyChoose } from "@/data/dummy";

export function WhyChooseSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft sm:p-8">
        <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Why Choose InternAI</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">A focused experience for internship growth and company hiring excellence.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {whyChoose.map((reason, index) => (
            <div
              key={reason}
              className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-sm text-slate-700"
            >
              <p className="mb-2 inline-flex rounded-full bg-primary-50 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-primary-600">
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
