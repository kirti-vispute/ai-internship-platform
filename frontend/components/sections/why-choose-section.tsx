import { whyChoose } from "@/data/dummy";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { EqualHeightCardGrid } from "@/components/home/EqualHeightCardGrid";
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

        <ScrollReveal className="mt-5" variant="stagger-children" delayMs={120} staggerMs={90} distance={16}>
          <EqualHeightCardGrid
            items={whyChooseCards.map((item, index) => ({
              title: item.title,
              description: item.description,
              accent: index === 1 ? "blue" : "indigo"
            }))}
          />
        </ScrollReveal>
      </div>
    </section>
  );
}
