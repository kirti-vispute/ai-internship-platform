"use client";

import { AnimatedLogo } from "@/components/brand/animated-logo";
import { BrandTagline } from "@/components/brand/brand-tagline";
import { InternAILogo } from "@/components/brand/internai-logo";

export function AuthBrandHeader() {
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <AnimatedLogo size={64} />
      <InternAILogo variant="navbar" href="/" showWordmark className="justify-center" />
      <BrandTagline />
    </div>
  );
}
