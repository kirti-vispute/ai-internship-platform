"use client";

import Image from "next/image";
import Link from "next/link";
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

const ASSETS: Record<LogoVariant, { src: string; width: number; height: number }> = {
  main: { src: "/brand/logo-main.svg", width: 40, height: 40 },
  compact: { src: "/brand/logo-compact.svg", width: 32, height: 32 },
  icon: { src: "/brand/logo-icon.svg", width: 32, height: 32 },
  light: { src: "/brand/logo-light.svg", width: 160, height: 40 },
  dark: { src: "/brand/logo-dark.svg", width: 160, height: 40 },
  navbar: { src: "/brand/logo-compact.svg", width: 34, height: 34 },
  footer: { src: "/brand/logo-footer.svg", width: 140, height: 36 },
  watermark: { src: "/brand/logo-watermark.svg", width: 200, height: 50 },
  loading: { src: "/brand/logo-loading.svg", width: 56, height: 56 }
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
        src={asset.src}
        alt="InternAI logo"
        width={asset.width}
        height={asset.height}
        priority={variant === "navbar" || variant === "loading"}
        className="shrink-0"
      />
      {showWordmark && !wordmarkHidden && (
        <span className="text-lg font-extrabold tracking-tight text-ink dark:text-slate-100">InternAI</span>
      )}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href || "/"} className="inline-flex items-center" aria-label="InternAI home">
      {content}
    </Link>
  );
}
