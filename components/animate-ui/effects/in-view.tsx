"use client";

import { type ReactNode } from "react";
import { motion, type Variants, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

type InViewProps = {
  children: ReactNode;
  className?: string;
  /** distance in px the element travels while fading in */
  offset?: number;
  delay?: number;
  once?: boolean;
  as?: "div" | "section" | "span" | "li";
};

const buildVariants = (offset: number): Variants => ({
  hidden: { opacity: 0, y: offset },
  visible: { opacity: 1, y: 0 },
});

const transition = (delay: number): Transition => ({
  duration: 0.55,
  delay,
  ease: [0.16, 1, 0.3, 1],
});

/**
 * Reveal children with a fade + rise as they scroll into the viewport.
 * animate-ui style effect wrapper (motion/react).
 */
export function InView({
  children,
  className,
  offset = 24,
  delay = 0,
  once = true,
  as = "div",
}: InViewProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.3 }}
      variants={buildVariants(offset)}
      transition={transition(delay)}
    >
      {children}
    </MotionTag>
  );
}
