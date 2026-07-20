"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

type AccordionItemData = { q: string; a: ReactNode };

type AccordionProps = {
  items: AccordionItemData[];
  className?: string;
  itemClassName?: string;
  summaryClassName?: string;
  answerClassName?: string;
};

/**
 * animate-ui style accordion: animated height/opacity disclosure.
 * Replaces native <details>. Styling passed via className props.
 */
export function Accordion({
  items,
  className,
  itemClassName,
  summaryClassName,
  answerClassName,
}: AccordionProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={cn(className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className={cn(itemClassName)} data-open={isOpen}>
            <button
              type="button"
              className={cn(summaryClassName)}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.q}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: "inline-block", lineHeight: 1 }}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className={cn(answerClassName)}>{item.a}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
