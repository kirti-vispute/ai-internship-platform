import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { LiveHiringSection } from "@/components/home/LiveHiringSection";
import { FeaturesSection } from "@/components/sections/features-section";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";
import { WhyChooseSection } from "@/components/sections/why-choose-section";

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip overflow-y-visible">
      <Navbar />
      <HeroSection />
      <LiveHiringSection />
      <FeaturesSection />
      <WhyChooseSection />
      <StatsSection />
      <Footer />
    </main>
  );
}
