import { ScrollReveal } from "@/components/animations/ScrollReveal";

type WorkflowStep = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  outcome: string;
  variant: "slide-right" | "blur-up" | "clip-reveal" | "tilt-rise" | "zoom-in" | "slide-left";
};

const steps: WorkflowStep[] = [
  {
    id: "resume-upload",
    title: "1. Student Uploads Resume",
    subtitle: "Resume Upload",
    description:
      "Students upload resumes once and instantly sync profile fundamentals across recommendations, applications, and interview prep.",
    outcome: "Clean profile ingestion with structured candidate data.",
    variant: "slide-right"
  },
  {
    id: "ai-analyzes",
    title: "2. AI Analyzes Resume",
    subtitle: "AI Engine",
    description:
      "The AI engine parses technical and contextual signals, evaluates quality, and understands role-level relevance in real time.",
    outcome: "Reliable parsing and semantic profile understanding.",
    variant: "blur-up"
  },
  {
    id: "resume-score",
    title: "3. Resume Score Is Generated",
    subtitle: "Resume Score",
    description:
      "A transparent scorecard highlights ATS compatibility, impact strength, and readiness indicators teams can trust.",
    outcome: "Confidence score tied to practical hiring outcomes.",
    variant: "clip-reveal"
  },
  {
    id: "skill-gap",
    title: "4. Skill Gap Is Detected",
    subtitle: "Skill Gap",
    description:
      "The system identifies missing skills for each target internship and recommends focused upskilling paths.",
    outcome: "Actionable growth plan before application submission.",
    variant: "tilt-rise"
  },
  {
    id: "verified-companies",
    title: "5. Verified Companies Are Matched",
    subtitle: "Verified Match",
    description:
      "Candidate fit signals are routed to trusted employers, improving quality of both intern discovery and recruiter shortlisting.",
    outcome: "Higher signal-to-noise company matching.",
    variant: "zoom-in"
  },
  {
    id: "pipeline-progress",
    title: "6. Hiring Pipeline Progress Is Tracked",
    subtitle: "Hiring Pipeline",
    description:
      "Each application moves through visible workflow stages so interns and hiring teams stay aligned from shortlist to final decision.",
    outcome: "Faster hiring loops with transparent status updates.",
    variant: "slide-left"
  }
];

function StepVisual({ stepId }: { stepId: string }) {
  if (stepId === "resume-upload") {
    return (
      <div className="rounded-2xl border border-cyan-300/25 bg-slate-900/75 p-4 shadow-[0_16px_30px_rgba(8,145,178,0.24)]">
        <div className="h-2 w-16 rounded-full bg-cyan-200/80" />
        <div className="mt-3 h-2 w-40 rounded-full bg-cyan-100/55" />
        <div className="mt-2 h-2 w-36 rounded-full bg-cyan-100/45" />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="h-8 rounded-lg bg-cyan-300/30" />
          <div className="h-8 rounded-lg bg-cyan-300/20" />
          <div className="h-8 rounded-lg bg-cyan-300/15" />
        </div>
      </div>
    );
  }

  if (stepId === "ai-analyzes") {
    return (
      <div className="relative flex h-full min-h-[150px] items-center justify-center rounded-2xl border border-indigo-300/25 bg-slate-900/75 shadow-[0_16px_30px_rgba(99,102,241,0.24)]">
        <div className="absolute h-24 w-24 rounded-full bg-indigo-500/22 blur-xl" />
        <div className="h-20 w-20 animate-[pulse_4.8s_ease-in-out_infinite] rounded-full border border-indigo-200/50 bg-indigo-400/25" />
        <div className="absolute h-12 w-12 rounded-full border border-cyan-200/60 bg-cyan-300/25" />
      </div>
    );
  }

  if (stepId === "resume-score") {
    return (
      <div className="rounded-2xl border border-sky-300/25 bg-slate-900/75 p-4 shadow-[0_16px_30px_rgba(14,165,233,0.22)]">
        <div className="flex items-end gap-2">
          <div className="h-8 w-3 rounded bg-sky-200/75" />
          <div className="h-12 w-3 rounded bg-sky-300/75" />
          <div className="h-16 w-3 rounded bg-sky-400/75" />
          <div className="h-11 w-3 rounded bg-sky-300/75" />
          <div className="h-14 w-3 rounded bg-sky-500/80" />
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-slate-700">
          <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-sky-300 to-blue-500" />
        </div>
      </div>
    );
  }

  if (stepId === "skill-gap") {
    return (
      <div className="rounded-2xl border border-teal-300/25 bg-slate-900/75 p-4 shadow-[0_16px_30px_rgba(20,184,166,0.22)]">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-teal-200/20 bg-teal-500/15 p-2 text-xs text-teal-100">Required Skills</div>
          <div className="rounded-lg border border-amber-200/20 bg-amber-400/15 p-2 text-xs text-amber-100">Missing Skills</div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div className="h-full w-3/4 rounded-full bg-teal-400" />
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div className="h-full w-2/5 rounded-full bg-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  if (stepId === "verified-companies") {
    return (
      <div className="rounded-2xl border border-blue-300/25 bg-slate-900/75 p-4 shadow-[0_16px_30px_rgba(59,130,246,0.22)]">
        <div className="flex items-center justify-between rounded-xl border border-blue-200/20 bg-blue-500/12 p-3">
          <span className="text-xs text-blue-100">Verified Company Pool</span>
          <span className="rounded-full bg-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-100">Trusted</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="h-9 rounded-lg bg-blue-300/25" />
          <div className="h-9 rounded-lg bg-blue-300/20" />
          <div className="h-9 rounded-lg bg-blue-300/15" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-300/25 bg-slate-900/75 p-4 shadow-[0_16px_30px_rgba(34,211,238,0.2)]">
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/15 p-2 text-center text-[10px] text-cyan-100">Applied</div>
        <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/20 p-2 text-center text-[10px] text-cyan-100">Shortlist</div>
        <div className="rounded-lg border border-cyan-200/20 bg-cyan-300/25 p-2 text-center text-[10px] text-cyan-100">Interview</div>
      </div>
      <div className="mt-3 h-2 rounded-full bg-slate-700">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500" />
      </div>
    </div>
  );
}

export function WorkflowStorySection() {
  return (
    <section className="pb-16 pt-12 sm:pb-20 sm:pt-16">
      <div className="container-shell">
        <ScrollReveal variant="soft-scale" distance={18} className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">AI Internship Matching Flow</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            A cinematic, step-by-step workflow from resume upload to hiring decisions.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Each stage below reveals a live system capability: analysis, scoring, skill intelligence, verified company matching,
            and transparent hiring progression.
          </p>
        </ScrollReveal>

        <div className="mt-8 space-y-5 sm:space-y-6">
          {steps.map((step, index) => (
            <ScrollReveal
              key={step.id}
              variant={step.variant}
              delayMs={index * 45}
              distance={18}
              className="will-change-transform"
            >
              <article className="group rounded-3xl border border-slate-700/75 bg-slate-900/72 p-5 shadow-[0_22px_46px_rgba(2,6,23,0.5)] transition-all duration-300 hover:border-cyan-300/45 hover:shadow-[0_30px_56px_rgba(6,182,212,0.24)] sm:p-6">
                <div className={`grid items-center gap-4 md:gap-6 ${index % 2 === 0 ? "lg:grid-cols-[1.2fr_0.8fr]" : "lg:grid-cols-[0.8fr_1.2fr]"}`}>
                  <div className={index % 2 === 0 ? "order-1" : "order-2 lg:order-1"}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{step.subtitle}</p>
                    <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
                    <p className="mt-4 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-100">
                      {step.outcome}
                    </p>
                  </div>
                  <div className={index % 2 === 0 ? "order-2" : "order-1 lg:order-2"}>
                    <StepVisual stepId={step.id} />
                  </div>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
