import { ScrollReveal } from "@/components/animations/ScrollReveal";

const steps = [
  {
    title: "Upload Resume",
    description: "Intern submits resume and profile data into the platform."
  },
  {
    title: "AI Analysis",
    description: "The engine parses structure, skills, and role relevance."
  },
  {
    title: "Skill Gap Detection",
    description: "Missing competencies are identified with practical guidance."
  },
  {
    title: "Internship Matching",
    description: "AI ranks verified internships using fit and confidence signals."
  },
  {
    title: "Hiring Pipeline",
    description: "Application progress is tracked from shortlist to final outcome."
  }
] as const;

export function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-shell">
        <ScrollReveal variant="slide-left" distance={18} className="max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base">
            A guided workflow from resume input to verified hiring decisions.
          </p>
        </ScrollReveal>

        <div className="relative mt-9">
          <div className="pointer-events-none absolute left-0 right-0 top-11 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/55 to-transparent lg:block" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <ScrollReveal
                key={step.title}
                variant={index % 2 === 0 ? "blur-up" : "soft-scale"}
                delayMs={index * 55}
                distance={14}
                className="h-full"
              >
                <article className="relative flex h-full min-h-[202px] flex-col rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.12)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/65 hover:shadow-[0_24px_44px_rgba(15,23,42,0.24)] dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/80 dark:shadow-[0_16px_34px_rgba(2,6,23,0.55)] dark:hover:border-cyan-400/55">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/70 bg-cyan-400/12 text-sm font-bold text-cyan-700 dark:text-cyan-200">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{step.description}</p>
                  {index < steps.length - 1 ? (
                    <span className="pointer-events-none absolute -right-2 top-10 hidden text-lg text-cyan-400/70 lg:block">→</span>
                  ) : null}
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
