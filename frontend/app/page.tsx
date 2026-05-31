import dynamic from "next/dynamic";
import { Navbar } from "@/components/layout/navbar";
import { HeroSection } from "@/components/sections/hero-section";
import { Footer } from "@/components/layout/footer";

const LiveHiringSection = dynamic(
  () => import("@/components/home/LiveHiringSection").then((mod) => mod.LiveHiringSection),
  { loading: () => <section className="py-20" aria-hidden="true" /> }
);
const HowItWorksSection = dynamic(
  () => import("@/components/sections/how-it-works-section").then((mod) => mod.HowItWorksSection),
  { loading: () => <section className="py-20" aria-hidden="true" /> }
);
const FeaturesSection = dynamic(
  () => import("@/components/sections/features-section").then((mod) => mod.FeaturesSection),
  { loading: () => <section className="py-20" aria-hidden="true" /> }
);
const WhyChooseSection = dynamic(
  () => import("@/components/sections/why-choose-section").then((mod) => mod.WhyChooseSection),
  { loading: () => <section className="py-20" aria-hidden="true" /> }
);

export default function HomePage() {
  return (
    <main className="relative overflow-x-clip overflow-y-visible">
      <Navbar />
      <HeroSection />
      <LiveHiringSection />
      <HowItWorksSection />
      <FeaturesSection />
      <WhyChooseSection />
      <Footer />
    </main>
  );
}
