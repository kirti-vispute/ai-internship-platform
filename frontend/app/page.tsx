import { Inter } from "next/font/google";
import { HomepageBackground } from "@/components/home/HomepageBackground";
import { Navbar } from "@/components/layout/navbar";
import {
  HomepageAudience,
  HomepageCapabilities,
  HomepageCoachPreview,
  HomepageFinalCta,
  HomepageHero,
  HomepageHowItWorks
} from "@/components/home/v2/homepage-sections";
import "./homepage.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export default function HomePage() {
  return (
    <main className={`internai-home ${inter.variable} min-h-screen overflow-x-clip`}>
      <HomepageBackground />

      <div className="internai-home-content">
        <Navbar theme="dark" />

        <div className="hp-main">
          <HomepageHero />
          <HomepageHowItWorks />
          <HomepageCapabilities />
          <HomepageAudience />
          <HomepageCoachPreview />
          <HomepageFinalCta />
        </div>
      </div>
    </main>
  );
}
