import {motion, useReducedMotion, useScroll, useTransform} from 'motion/react';
import type {RefObject} from 'react';
import {
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';
import {CUE_LEAVE_EARLY_VH, PIN} from './scentAnatomyTimeline';

/**
 * Starts at the bottom of the first fold. On scroll it rises and sticks at
 * ~10% from the top. Parent spans through the cube section.
 *
 * Leave progress uses `end end` → `end start` — the same window as the
 * sticky cube panel scrolling away — so the label tracks the section exit.
 * CUE_LEAVE_EARLY_VH shifts that start (0 = sync).
 */
export function ScentAnatomyCue({
  scentSectionRef,
}: {
  scentSectionRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();

  const {scrollYProgress} = useScroll({
    target: scentSectionRef,
    offset: ['start end', 'end start'],
  });

  // 1 = section bottom @ viewport bottom (sticky release). >1 = earlier.
  const leaveStart = 1 + CUE_LEAVE_EARLY_VH / 100;
  const {scrollYProgress: leaveProgress} = useScroll({
    target: scentSectionRef,
    offset: [`end ${leaveStart}`, 'end start'],
  });

  const arrowOpacity = useTransform(scrollYProgress, [PIN - 0.02, PIN], [1, 0]);
  const arrowPointerEvents = useTransform(arrowOpacity, (v) =>
    v < 0.08 ? 'none' : 'auto',
  );

  const leaveY = useTransform(leaveProgress, [0, 1], ['0vh', '-100vh']);

  return (
    <motion.div
      className="sticky top-[10%] z-20 flex w-full shrink-0 flex-col items-center justify-center gap-1 pt-4 pb-3 text-inkwell-700/45 sm:pt-5 sm:pb-4"
      style={reducedMotion ? undefined : {y: leaveY}}
      initial={reducedMotion ? false : {opacity: 0}}
      animate={{opacity: 1}}
      transition={{
        delay: PRODUCT_FADE_DELAY + PRODUCT_FADE_DURATION * 0.55,
        duration: 0.45,
        ease: 'easeOut',
      }}
    >
      <span className="pointer-events-none font-['config-mono-vf'] text-[20px] uppercase tracking-[0.14em] sm:text-[22px]">
        SCENT ANATOMY
      </span>
      <motion.button
        type="button"
        className="h-7 w-7 shrink-0 cursor-pointer border-0 bg-transparent p-0 text-inherit transition-opacity hover:opacity-80"
        aria-label="Scroll to scent anatomy"
        style={
          reducedMotion
            ? undefined
            : {
                opacity: arrowOpacity,
                pointerEvents: arrowPointerEvents,
              }
        }
        onClick={() => {
          scentSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }}
      >
        <svg
          className="mx-auto h-5 w-5 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 5v14M19 12l-7 7-7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.button>
    </motion.div>
  );
}
