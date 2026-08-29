import Image from "next/image";
import { BRAND_LOGO_PATH, BRAND_LOGO_PATH_LIGHT, BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  size: number;
  alt?: string;
  className?: string;
  priority?: boolean;
  "aria-hidden"?: boolean;
};

// Swaps the icon's own light/dark badge artwork via the `dark:` class Tailwind
// already toggles off <html> (see ThemeProvider.applyToDocument) rather than
// reading appearance from useTheme() -- pure CSS avoids a hydration mismatch
// between the server render and the client's pre-hydration theme.
export function BrandMark({ size, alt = `${BRAND_NAME} logo`, className, priority, ...rest }: BrandMarkProps) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <Image
        src={BRAND_LOGO_PATH_LIGHT}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="block object-contain dark:hidden"
        style={{ width: size, height: size }}
        {...rest}
      />
      <Image
        src={BRAND_LOGO_PATH}
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className="hidden object-contain dark:block"
        style={{ width: size, height: size }}
        {...rest}
      />
    </span>
  );
}
