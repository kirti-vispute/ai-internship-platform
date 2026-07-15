import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[0.625rem]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base"
} as const;

const GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-violet-500 to-fuchsia-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-400",
  "from-indigo-500 to-blue-400"
];

function initialsOf(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function gradientFor(name?: string) {
  const seed = (name || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[seed % GRADIENTS.length];
}

type AvatarProps = {
  name?: string;
  src?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
};

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name || "Avatar"}
        className={cn("shrink-0 rounded-full border border-[var(--ds-border)] object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        gradientFor(name),
        SIZE_CLASSES[size],
        className
      )}
      aria-hidden={!name}
    >
      {initialsOf(name)}
    </span>
  );
}
