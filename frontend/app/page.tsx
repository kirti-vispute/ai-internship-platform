import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { WorkflowStorySection } from "@/components/home/WorkflowStorySection";
import { HeroSection } from "@/components/sections/hero-section";
import { StatsSection } from "@/components/sections/stats-section";

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip overflow-y-visible">
      <Navbar />
      <HeroSection />
      <WorkflowStorySection />
      <StatsSection />
      <Footer />
    </main>
  );
}
