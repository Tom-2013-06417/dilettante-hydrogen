import {PlayIcon} from '@heroicons/react/24/solid';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import {useRef, type RefObject} from 'react';
import {
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';
import {smoothScrollTo} from '~/lib/smoothScroll';
import {easeExit, leaveMark, PIN, SCRUB_END} from './scentAnatomyTimeline';

/**
 * Starts at the bottom of the first fold. On scroll it rises and sticks at
 * ~10% from the top. Parent spans through the cube section.
 *
 * Leave matches the cube’s transform exit (SCRUB_END runway) — ease-in-out
 * lift in sync with the sticky shell, not native release.
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

/**
 * GSAP CustomBounce–style pulse (endAtStart): one hit, then decaying
 * bounces that settle at rest before the next cycle.
 *
 * Module scope keeps the identity stable — the parent re-renders on every
 * scroll frame, and fresh objects here restart the keyframes (visible flicker).
 * @see https://www.gsap.com/docs/v3/Eases/
 */
const BEAT_TRANSITION: Transition = {
  duration: 2,
  repeat: Infinity,
  times: [0, 0.14, 0.28, 0.4, 0.5, 0.58, 0.66, 0.73, 0.82, 1],
  // Slight ease between apexes so it feels physical, not stepped
  ease: [
    [0.22, 1, 0.36, 1], // punch up
    [0.55, 0.05, 0.8, 0.4], // fall
    [0.22, 1.2, 0.36, 1], // bounce 1
    [0.55, 0.05, 0.75, 0.45],
    [0.22, 1.15, 0.36, 1], // bounce 2
    [0.55, 0.08, 0.7, 0.5],
    [0.22, 1.1, 0.36, 1], // bounce 3
    [0.45, 0.1, 0.55, 1], // settle
    'linear', // rest
  ],
};

const BEAT_KEYFRAMES: TargetAndTransition = {
  scale: [1, 1.12, 0.94, 1.055, 0.975, 1.025, 0.99, 1.008, 1, 1],
};

const SPIN_TRANSITION: Transition = {
  duration: 12,
  repeat: Infinity,
  ease: 'linear',
};

const SPIN_KEYFRAMES: TargetAndTransition = {rotate: 360};

/**
 * Play control on the scent-anatomy sticky shell. Fades in after the cube
 * explodes; scrolls to the scenes / VHS section.
 */
export function ScenesCue({
  scentSectionRef,
  scenesSectionRef,
}: {
  scentSectionRef: RefObject<HTMLElement | null>;
  scenesSectionRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();

  const {scrollYProgress} = useScroll({
    target: scentSectionRef,
    offset: ['start end', `${SCRUB_END} start`],
  });

  // Appear once halves have separated; stay through the scrub hold
  const opacity = useTransform(
    scrollYProgress,
    [PIN + 0.1, PIN + 0.16],
    [0, 1],
  );

  const scrollToScenes = () => {
    const el = scenesSectionRef.current;
    if (el) smoothScrollTo(el, {duration: 1800});
  };

  // Only fire scroll if press started on this button (ignore scroll-gesture ends)
  const pressRef = useRef(false);

  return (
    <motion.div
      className="flex w-full items-center justify-center"
      style={reducedMotion ? {opacity: 1} : {opacity}}
    >
      <div className="relative flex size-14 items-center justify-center">
        {/* Dashed ring — steady moderate spin, no pulse */}
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full border border-dashed border-inkwell-700/50"
          aria-hidden
          animate={reducedMotion ? undefined : SPIN_KEYFRAMES}
          transition={reducedMotion ? undefined : SPIN_TRANSITION}
        />
        {/*
          Static hit target (pulse is on the inner visual only).
          touch-manipulation avoids the mobile double-tap delay.
        */}
        <button
          type="button"
          className="relative flex size-14 cursor-pointer touch-manipulation items-center justify-center border-0 bg-transparent p-0"
          aria-label="Play scenes"
          onPointerDown={(e) => {
            if (e.button === 0) pressRef.current = true;
          }}
          onPointerCancel={() => {
            pressRef.current = false;
          }}
          onPointerUp={(e) => {
            if (e.button !== 0 || !pressRef.current) return;
            pressRef.current = false;
            e.stopPropagation();
            scrollToScenes();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToScenes();
            }
          }}
        >
          <motion.span
            className="pointer-events-none flex size-12 items-center justify-center rounded-full bg-inkwell-700 text-vellum-100 will-change-transform"
            aria-hidden
            animate={reducedMotion ? undefined : BEAT_KEYFRAMES}
            transition={reducedMotion ? undefined : BEAT_TRANSITION}
          >
            <PlayIcon className="size-5 translate-x-px" />
          </motion.span>
        </button>
      </div>
    </motion.div>
  );
}
