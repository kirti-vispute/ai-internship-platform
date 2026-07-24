import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  cursorType?: "card" | "button" | "link";
};

export function TiltCard({ children, className, cursorType = "card" }: TiltCardProps) {
  return (
    <div
      data-cursor={cursorType}
      className={cn(
        "tilt-3d relative overflow-hidden rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-card)] shadow-[0_12px_30px_rgba(15,23,42,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(15,23,42,0.16)]",
        className
      )}
    >
      {children}
    </div>
  );
}

