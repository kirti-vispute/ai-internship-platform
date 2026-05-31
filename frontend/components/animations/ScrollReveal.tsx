"use client";

import { Children } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealVariant =
  | "fade-up"
  | "soft-scale"
  | "stagger-children"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "tilt-rise";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  distance?: number;
  variant?: RevealVariant;
  threshold?: number;
  once?: boolean;
  staggerMs?: number;
};

type MotionState = {
  opacity: number;
  y?: number;
  x?: number;
  scale?: number;
  rotateX?: number;
};

function buildStates(variant: Exclude<RevealVariant, "stagger-children">, distance: number, reducedMotion: boolean): { hidden: MotionState; visible: MotionState } {
  if (reducedMotion) return { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  if (variant === "soft-scale") {
    return { hidden: { opacity: 0, y: 6, scale: 0.99 }, visible: { opacity: 1, y: 0, scale: 1 } };
  }
  if (variant === "slide-left") {
    return { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } };
  }
  if (variant === "slide-right") {
    return { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } };
  }
  if (variant === "zoom-in") {
    return { hidden: { opacity: 0, y: 4, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1 } };
  }
  if (variant === "tilt-rise") {
    return { hidden: { opacity: 0, y: distance, rotateX: 4 }, visible: { opacity: 1, y: 0, rotateX: 0 } };
  }
  return { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } };
}

export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  distance = 10,
  variant = "fade-up",
  threshold = 0.12,
  once = true,
  staggerMs = 60
}: ScrollRevealProps) {
  const reducedMotion = useReducedMotion();
  const delay = delayMs / 1000;
  const stagger = staggerMs / 1000;

  if (variant === "stagger-children") {
    const items = Children.toArray(children);
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: threshold }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: delay,
              staggerChildren: reducedMotion ? 0 : stagger
            }
          }
        }}
      >
        {items.map((child, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: reducedMotion ? { opacity: 0 } : { opacity: 0, y: Math.max(distance - 4, 4) },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
            }}
          >
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  const states = buildStates(variant, distance, !!reducedMotion);

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={{
        hidden: states.hidden,
        visible: {
          ...states.visible,
          transition: {
            delay,
            duration: 0.38,
            ease: [0.22, 1, 0.36, 1]
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}
