import Image from "next/image";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@/lib/brand";

type PortalBrandHeaderProps = {
  portalLabel: string;
};

export function PortalBrandHeader({ portalLabel }: PortalBrandHeaderProps) {
  return (
    <div className="ds-card mb-6 p-4">
      <div className="flex items-center gap-3">
        <Image src={BRAND_LOGO_PATH} alt="" width={36} height={36} className="shrink-0 rounded-lg object-contain" aria-hidden />
        <div className="min-w-0">
          <p className="ds-label">{portalLabel}</p>
          <h2 className="ds-h2 mt-1 truncate">{BRAND_NAME}</h2>
        </div>
      </div>
    </div>
  );
}
