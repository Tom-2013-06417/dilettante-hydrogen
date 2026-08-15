import {motion, useReducedMotion, useScroll, useTransform} from 'motion/react';
import {type RefObject} from 'react';
import {useLocation} from 'react-router';
import {
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';
import {isStackEnterState} from '~/lib/constants';
import {PIN, SCRUB_END} from './scentAnatomyTimeline';
import {useScenesGate} from './scenesGate';

/**
 * Both scroll cues on the product page share this outlined-box form.
 * `rounded-none` is needed: tailwind.css's base layer gives every button a
 * --radius-button corner.
 */
const CUE_BUTTON_CLASS =
  "flex shrink-0 cursor-pointer items-center gap-x-2 rounded-none border border-inkwell-700 bg-transparent px-2.5 py-1.5 font-['config-mono-vf'] text-[14px] tracking-[0.06em] text-inkwell-700 outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none sm:text-[15px]";

function CueArrow() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
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
  );
}

/**
 * Starts at the bottom of the first fold. On scroll it rises and sticks at
 * ~20% from the top, then fades out once the cube pins.
 */
export function ScentAnatomyCue({
  scentSectionRef,
}: {
  scentSectionRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const {state} = useLocation();
  const stackEnter = isStackEnterState(state);

  const {scrollYProgress} = useScroll({
    target: scentSectionRef,
    // Same scrub window as the cube (explode / pin), not the exit runway
    offset: ['start end', `${SCRUB_END} start`],
  });

  // Rests at 0.75, not 1 — the class below covers the reduced-motion path,
  // where no inline motion style is applied.
  const arrowOpacity = useTransform(
    scrollYProgress,
    [PIN - 0.02, PIN],
    [0.75, 0],
  );
  const arrowPointerEvents = useTransform(arrowOpacity, (v) =>
    v < 0.08 ? 'none' : 'auto',
  );

  return (
    <motion.div
      className="sticky top-[20%] z-20 flex w-full shrink-0 flex-col items-center pt-[var(--scent-anatomy-cue-pad-top,8px)] pb-[var(--scent-anatomy-cue-pad-bottom,40px)] text-inkwell-700/45"
      initial={reducedMotion || stackEnter ? false : {opacity: 0}}
      animate={{opacity: 1}}
      transition={{
        delay: stackEnter
          ? 0.12
          : PRODUCT_FADE_DELAY + PRODUCT_FADE_DURATION * 0.55,
        duration: 0.45,
        ease: 'easeOut',
      }}
    >
      <motion.button
        type="button"
        className={`${CUE_BUTTON_CLASS} h-[var(--scent-anatomy-cue-btn-h,32px)] opacity-75 transition-opacity hover:opacity-100`}
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
        <CueArrow />
        Anatomy
      </motion.button>
    </motion.div>
  );
}

/** Width of the soft edge where the label crosses from inkwell to vellum. */
const LABEL_FEATHER_PX = 14;

/**
 * Terminal control on the scent-anatomy stage. Fades in once the cube
 * explodes, then fills as the reader overscrolls the end of the page — see
 * scenesGate. Deliberately unlabelled; the scenes panel is meant to arrive
 * unannounced.
 */
export function ScenesCue({
  scentSectionRef,
}: {
  scentSectionRef: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const {fill, cueRef, openScenes} = useScenesGate();

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

  const wash = useTransform(fill, (v) => `inset(0 ${(1 - v) * 100}% 0 0)`);
  /**
   * The vellum twin is faded in across a soft band that travels with the wash,
   * rather than clipped hard at its edge. A hard edge crossing the glyphs reads
   * as a rendering fault; tinting the whole label at once instead leaves
   * whichever half hasn't caught up sitting at almost no contrast.
   *
   * Runs -6%…106% so the band is fully off the button at both ends.
   */
  const labelMask = useTransform(fill, (v) => {
    const edge = -6 + v * 112;
    return `linear-gradient(to right, #000 calc(${edge}% - ${LABEL_FEATHER_PX}px), transparent calc(${edge}% + ${LABEL_FEATHER_PX}px))`;
  });

  return (
    <motion.div
      className="flex w-full shrink-0 flex-col items-center pt-[var(--scent-anatomy-cue-pad-top,8px)] pb-[var(--scent-anatomy-cue-pad-bottom,40px)]"
      style={reducedMotion ? {opacity: 1} : {opacity}}
    >
      {/*
        Opacity is driven inline on the wrapper above, so the button keeps a
        working CSS hover. touch-manipulation avoids the mobile double-tap delay.
      */}
      <button
        ref={cueRef}
        type="button"
        className={`${CUE_BUTTON_CLASS} relative h-[var(--scent-anatomy-cue-btn-h,32px)] touch-manipulation overflow-hidden opacity-75 transition-opacity hover:opacity-100`}
        aria-label="Open scenes"
        onClick={openScenes}
      >
        <motion.span
          className="pointer-events-none absolute inset-0 bg-inkwell-700"
          style={{clipPath: wash}}
          aria-hidden
        />
        {/* aria-hidden on the glyphs: "???" reads as punctuation noise to a
            screen reader, and the button's own label already covers it. */}
        <span className="relative z-10 flex items-center gap-x-2">
          <CueArrow />
          <span aria-hidden>???</span>
        </span>
        <motion.span
          className="pointer-events-none absolute inset-0 z-10 flex items-center gap-x-2 px-2.5 py-1.5 text-vellum-100"
          style={{maskImage: labelMask, WebkitMaskImage: labelMask}}
          aria-hidden
        >
          <CueArrow />
          <span>???</span>
        </motion.span>
      </button>
    </motion.div>
  );
}
