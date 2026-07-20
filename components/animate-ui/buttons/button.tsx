"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

type AnimateButtonProps = HTMLMotionProps<"button"> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled">;

/**
 * animate-ui style button: springy hover-lift + tap-press.
 * Style-agnostic — pass your own className (colors/fonts preserved).
 */
export const AnimateButton = forwardRef<HTMLButtonElement, AnimateButtonProps>(
  function AnimateButton({ className, children, ...props }, ref) {
    return (
      <motion.button
        ref={ref}
        className={cn(className)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
