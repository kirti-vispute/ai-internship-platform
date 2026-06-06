"use client";

import { BrandTagline } from "@/components/brand/brand-tagline";
import { InternAILogo } from "@/components/brand/internai-logo";

export function AuthBrandHeader() {
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <InternAILogo variant="loading" href="/" showWordmark className="justify-center" interactive={false} />
      <BrandTagline />
    </div>
  );
}
