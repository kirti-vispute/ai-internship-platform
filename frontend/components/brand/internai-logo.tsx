"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type LogoVariant =
  | "main"
  | "compact"
  | "icon"
  | "light"
  | "dark"
  | "navbar"
  | "footer"
  | "watermark"
  | "loading";

const ASSETS: Record<LogoVariant, { width: number; height: number }> = {
  main: { width: 40, height: 40 },
  compact: { width: 32, height: 32 },
  icon: { width: 32, height: 32 },
  light: { width: 160, height: 40 },
  dark: { width: 160, height: 40 },
  navbar: { width: 34, height: 34 },
  footer: { width: 140, height: 36 },
  watermark: { width: 200, height: 50 },
  loading: { width: 56, height: 56 }
};

type InternAILogoProps = {
  variant?: LogoVariant;
  href?: string | null;
  showWordmark?: boolean;
  className?: string;
  interactive?: boolean;
};

export function InternAILogo({
  variant = "navbar",
  href = "/",
  showWordmark = true,
  className,
  interactive = true
}: InternAILogoProps) {
  const asset = ASSETS[variant];
  const wordmarkHidden = variant === "light" || variant === "dark" || variant === "footer" || variant === "watermark";

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        interactive && "transition duration-200 hover:scale-[1.02]",
        className
      )}
    >
      <Image
        src={BRAND_LOGO_PATH}
        alt={`${BRAND_NAME} logo`}
        width={asset.width}
        height={asset.height}
        priority={variant === "navbar" || variant === "loading"}
        className="shrink-0 object-contain"
      />
      {showWordmark && !wordmarkHidden && (
        <span className="text-lg font-extrabold tracking-tight text-ink dark:text-slate-100">{BRAND_NAME}</span>
      )}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href || "/"} className="inline-flex items-center" aria-label={`${BRAND_NAME} home`}>
      {content}
    </Link>
  );
}
