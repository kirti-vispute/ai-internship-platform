import { stats } from "@/data/dummy";

const trustedCompanies = ["Acme Labs", "NovaTech", "OrbitWorks", "PixelForge", "CloudNest"];

export function StatsSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell">
        <div className="rounded-3xl bg-slateDeep p-6 text-white shadow-soft sm:p-10">
          <p className="text-xs uppercase tracking-widest text-white/70">Trusted Ecosystem</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Trusted by ambitious talent and teams</h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {trustedCompanies.map((name) => (
              <span key={name} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80">
                {name}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
