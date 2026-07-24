import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24
} as const;

export type AppIconSize = keyof typeof SIZE_MAP;

type AppIconProps = {
  icon: LucideIcon;
  size?: AppIconSize;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
};

export function AppIcon({ icon: Icon, size = "sm", className, strokeWidth = 1.75, style }: AppIconProps) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-[var(--ds-muted)] transition-colors", className)}
      style={style}
      aria-hidden
    >
      <Icon size={SIZE_MAP[size]} strokeWidth={strokeWidth} />
    </span>
  );
}
