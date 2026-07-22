import {motion, useReducedMotion, useScroll, useTransform} from 'motion/react';
import type {RefObject} from 'react';
import {
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';
import {PIN, STICKY_RELEASE} from './scentAnatomyTimeline';

/**
 * Starts at the bottom of the first fold. On scroll it rises and sticks at
 * ~10% from the top. Parent spans through the cube section.
 *
 * A short sticky label would otherwise lag behind the full-viewport cube on
 * exit — so we lift it in sync from STICKY_RELEASE (when the cube starts
 * moving up) instead of waiting for the section bottom to clear.
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

  const arrowOpacity = useTransform(scrollYProgress, [PIN - 0.02, PIN], [1, 0]);
  const arrowHeight = useTransform(
    arrowOpacity,
    (v) => `${Math.round(v * 28)}px`,
  );
  const arrowPointerEvents = useTransform(arrowOpacity, (v) =>
    v < 0.08 ? 'none' : 'auto',
  );

  // Match the sticky cube panel’s exit travel (~1 viewport)
  const leaveY = useTransform(
    scrollYProgress,
    [STICKY_RELEASE, 1],
    ['0vh', '-100vh'],
  );

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
        className="cursor-pointer overflow-hidden border-0 bg-transparent p-0 text-inherit transition-opacity hover:opacity-80"
        aria-label="Scroll to scent anatomy"
        style={
          reducedMotion
            ? undefined
            : {
                opacity: arrowOpacity,
                height: arrowHeight,
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
