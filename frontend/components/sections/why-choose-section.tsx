import { whyChoose } from "@/data/dummy";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { SectionAnimator } from "@/components/home/SectionAnimator";

const whyChooseCards = whyChoose.map((reason) => {
  const parts = reason.split(" that ");
  if (parts.length > 1) {
    return {
      title: parts[0],
      description: `That ${parts.slice(1).join(" that ")}`
    };
  }

  const words = reason.split(" ");
  return {
    title: words.slice(0, 3).join(" "),
    description: words.slice(3).join(" ")
  };
});

export function WhyChooseSection() {
  return (
    <section className="pb-16 sm:pb-20">
      <div className="container-shell rounded-3xl border border-slate-200 bg-white/92 p-6 shadow-[0_20px_44px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-900/82 dark:shadow-[0_20px_48px_rgba(2,6,23,0.55)] sm:p-8">
        <SectionAnimator revealVariant="tilt-rise" distance={20} parallax={8}>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Why InternAI stands out
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-700 dark:text-slate-200">
            Designed for real internship conversion outcomes, not just dashboard visuals.
          </p>
        </SectionAnimator>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {whyChooseCards.map((item, index) => (
            <ScrollReveal
              key={item.title}
              delayMs={120 + index * 85}
              variant={index % 2 === 0 ? "slide-left" : "slide-right"}
              distance={18}
            >
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 text-sm text-slate-800 shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:text-slate-200 dark:shadow-[0_14px_30px_rgba(2,6,23,0.5)] dark:hover:shadow-[0_20px_40px_rgba(2,6,23,0.62)]">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                <p className="mt-2 leading-6 text-slate-700 dark:text-slate-300">{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
