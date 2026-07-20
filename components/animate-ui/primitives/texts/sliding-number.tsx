"use client";

import { useEffect, useRef, useState } from "react";
import {
  useInView,
  useMotionValue,
  useSpring,
  type SpringOptions,
} from "motion/react";
import { cn } from "@/lib/utils";

type SlidingNumberProps = {
  /** target value to count up to */
  value: number;
  className?: string;
  /** run the count-up only when scrolled into view */
  startOnView?: boolean;
  spring?: SpringOptions;
};

/**
 * Animated number that springs from 0 to `value`.
 * animate-ui style text primitive (motion/react).
 */
export function SlidingNumber({
  value,
  className,
  startOnView = true,
  spring = { stiffness: 90, damping: 20, mass: 1 },
}: SlidingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, spring);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!startOnView || inView) {
      motionValue.set(value);
    }
  }, [motionValue, value, inView, startOnView]);

  useEffect(() => {
    const unsub = springValue.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });
    return unsub;
  }, [springValue]);

  return (
    <span ref={ref} className={cn(className)}>
      {display}
    </span>
  );
}
