import Image from "next/image";
import { BRAND_LOGO_PATH, BRAND_NAME } from "@/lib/brand";

type PortalBrandHeaderProps = {
  portalLabel: string;
};

export function PortalBrandHeader({ portalLabel }: PortalBrandHeaderProps) {
  return (
    <div className="ds-card mb-6 p-4">
      <div className="flex items-center gap-3">
        {/* Explicit h-9 w-9 (36px) keeps both axes CSS-governed to match the width/height
            props — without it, Tailwind's preflight `img { height: auto }` only overrides
            height, leaving width attribute-governed, which Next.js flags as a size mismatch. */}
        <Image
          src={BRAND_LOGO_PATH}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
          aria-hidden
        />
        <div className="min-w-0">
          <p className="ds-label">{portalLabel}</p>
          <h2 className="ds-h2 mt-1 truncate">{BRAND_NAME}</h2>
        </div>
      </div>
    </div>
  );
}
