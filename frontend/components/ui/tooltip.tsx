"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type TooltipProps = {
  content: string;
  side?: "top" | "bottom";
  className?: string;
  children: React.ReactNode;
};

export function Tooltip({ content, side = "top", className, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      <AnimatePresence>
        {open ? (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-50 w-max max-w-[14rem] -translate-x-1/2 rounded-lg border border-[var(--ds-border-strong)] bg-[var(--ds-surface-raised)] px-2.5 py-1.5 text-center text-xs font-medium text-[var(--ds-text)] shadow-xl",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            )}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
