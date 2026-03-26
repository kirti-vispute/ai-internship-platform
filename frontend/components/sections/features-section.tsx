import { Card } from "@/components/ui/card";
import { features } from "@/data/dummy";

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container-shell">
        <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Platform Features</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Everything required to streamline internship hiring and candidate growth.
            </p>
          </div>
          <p className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            Built for outcomes
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item, index) => (
            <Card key={item.title} className="animate-fade-up">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Feature {index + 1}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-primary-500 to-blue-500" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
