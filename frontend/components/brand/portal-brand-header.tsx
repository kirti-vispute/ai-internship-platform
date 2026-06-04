import Image from "next/image";
import { BRAND_NAME } from "@/lib/brand";

type PortalBrandHeaderProps = {
  portalLabel: string;
};

export function PortalBrandHeader({ portalLabel }: PortalBrandHeaderProps) {
  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary-600 to-blue-600 p-4 text-white shadow-glow dark:from-primary-700 dark:to-cyan-600">
      <div className="flex items-center gap-3">
        <Image src="/brand/logo-icon.svg" alt="" width={36} height={36} className="shrink-0 rounded-lg" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-primary-100">{portalLabel}</p>
          <h2 className="mt-1 truncate text-xl font-black tracking-tight">{BRAND_NAME}</h2>
        </div>
      </div>
    </div>
  );
}
