import {motion, useReducedMotion, useScroll, useTransform} from 'motion/react';
import type {RefObject} from 'react';
import {
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';
import {easeExit, leaveMark, PIN, SCRUB_END} from './scentAnatomyTimeline';

/**
 * Starts at the bottom of the first fold. On scroll it rises and sticks at
 * ~10% from the top. Parent spans through the cube section.
 *
 * Leave matches the cube’s transform exit (SCRUB_END runway) — ease-in-out
 * lift in sync with the sticky shell, not native sticky release.
 */
export function ScentAnatomyCue({
  scentSectionRef,
}: {
  scentSectionRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();

  const {scrollYProgress} = useScroll({
    target: scentSectionRef,
    // Same scrub window as the cube (explode / pin), not the exit runway
    offset: ['start end', `${SCRUB_END} start`],
  });

  const mark = leaveMark();
  const {scrollYProgress: leaveProgress} = useScroll({
    target: scentSectionRef,
    offset: [`${mark} end`, `${mark} start`],
  });

  const arrowOpacity = useTransform(scrollYProgress, [PIN - 0.02, PIN], [1, 0]);
  const arrowPointerEvents = useTransform(arrowOpacity, (v) =>
    v < 0.08 ? 'none' : 'auto',
  );

  const leaveY = useTransform(leaveProgress, (p) => {
    if (reducedMotion) return '0vh';
    return `${-easeExit(p) * 100}vh`;
  });

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
