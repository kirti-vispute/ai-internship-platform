import { BRAND_NAME } from "@/lib/brand";
import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

type PortalBrandHeaderProps = {
  portalLabel: string;
  /** Icon-only rail mode: drops the label/name text, keeps the logo centered. */
  collapsed?: boolean;
};

export function PortalBrandHeader({ portalLabel, collapsed = false }: PortalBrandHeaderProps) {
  return (
    <div className={cn("ds-card mb-6 p-4", collapsed && "px-2")}>
      <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
        <BrandMark
          size={36}
          alt={collapsed ? `${BRAND_NAME} — ${portalLabel}` : ""}
          className="rounded-lg"
          aria-hidden={collapsed ? undefined : true}
        />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="ds-label">{portalLabel}</p>
            <h2 className="ds-h2 mt-1 truncate">{BRAND_NAME}</h2>
          </div>
        ) : null}
      </div>
    </div>
  );
}
