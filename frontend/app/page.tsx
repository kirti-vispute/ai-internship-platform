import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { LiveHiringSection } from "@/components/home/LiveHiringSection";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FeaturesSection } from "@/components/sections/features-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { WhyChooseSection } from "@/components/sections/why-choose-section";

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip overflow-y-visible">
      <Navbar />
      <HeroSection />
      <ScrollReveal variant="fade-up" distance={12}>
        <LiveHiringSection />
      </ScrollReveal>
      <ScrollReveal variant="slide-left" distance={14}>
        <HowItWorksSection />
      </ScrollReveal>
      <ScrollReveal variant="soft-scale" distance={10}>
        <FeaturesSection />
      </ScrollReveal>
      <ScrollReveal variant="slide-right" distance={14}>
        <WhyChooseSection />
      </ScrollReveal>
      <Footer />
    </main>
  );
}
