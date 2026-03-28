import { stats } from "@/data/dummy";

const trustedCompanies = ["Acme Labs", "NovaTech", "OrbitWorks", "PixelForge", "CloudNest"];

export function StatsSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell">
        <div className="rounded-3xl bg-slateDeep p-6 text-white shadow-[0_24px_60px_rgba(2,6,23,0.5)] sm:p-10 dark:bg-slate-900">
          <p className="text-xs uppercase tracking-widest text-cyan-200/90">Verified Ecosystem</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Trusted by interns and companies building future-ready teams
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {trustedCompanies.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/85 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                {name}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_12px_28px_rgba(2,6,23,0.25)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_18px_36px_rgba(2,6,23,0.38)]"
              >
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-sm text-white/75">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
