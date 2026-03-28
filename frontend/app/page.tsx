import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FeaturesSection } from "@/components/sections/features-section";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";
import { WhyChooseSection } from "@/components/sections/why-choose-section";

export default function HomePage() {
  return (
    <main className="overflow-visible">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <WhyChooseSection />
      <StatsSection />
      <Footer />
    </main>
  );
}
