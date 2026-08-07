import {motion, useReducedMotion, type Variants} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import wordmarkVellum from '~/assets/design/wordmark-vellum.png';
import heroHome from '~/assets/design/hero-home.jpg';
import {CTA_SHELL} from '~/components/teaser/TeaserPage';
import {BrandIntro} from './sections/BrandIntro';
import {ScentFeature} from './sections/ScentFeature';
import {ScentAnatomy} from './sections/ScentAnatomy';

const SECTION_COUNT = 4;
const SNAP_DURATION_MS = 700;
const SNAP_UNLOCK_AT = 0.75;
const GESTURE_GAP_MS = 150;
const GESTURE_GROWTH_FACTOR = 1.3;
const GESTURE_TRIGGER_DELTA = 12;
const GESTURE_DECAY_CUTOFF = 0.7;
const EASE = [0.32, 0.72, 0, 1] as const;
/** Seconds before the hero CTA appears, after the wordmark has settled. */
const CTA_DELAY = 1.5;

const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: {staggerChildren: 0.12, delayChildren: 0},
  },
};

const fadeUp: Variants = {
  hidden: {opacity: 0, y: 16},
  show: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.8, ease: [0.22, 1, 0.36, 1]},
  },
};

function HomeHero({onScrollDown}: {onScrollDown: () => void}) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex h-svh w-full flex-col items-stretch overflow-hidden bg-inkwell-800">
      {/*
        Image on top, inkwell below — the teaser's arrangement. The wordmark
        straddles the seam from the inkwell band, hanging up over the image.
      */}
      {/*
        Height-first: the photo is 3:2, so a short well crops most of its
        height away. 68svh is the top of the teaser's clamp range — the band
        takes the remainder. Sides crop instead.
      */}
      <div className="relative h-[68svh] min-h-0 w-full shrink-0 overflow-hidden">
        <motion.img
          className="absolute inset-0 h-full w-full object-cover"
          src={heroHome}
          alt=""
          initial={reducedMotion ? false : {opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1.2, ease: 'easeOut'}}
        />
        <div className="absolute inset-0 flex items-start bg-inkwell-900/30" />
      </div>
      <motion.div
        className="relative flex w-full grow items-start bg-inkwell-800"
        variants={heroStagger}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
      >
        {/*
          Wordmark straddles the seam; the CTA hangs below it, in the slot the
          tagline used to occupy. Both are absolutely placed so neither adds
          height to the block that -translate-y-1/2 centres on the seam.
        */}
        <div className="absolute top-0 left-1/2 z-10 w-[92%] max-w-160 -translate-x-1/2 -translate-y-1/2">
          <h1 className="m-0!">
            <motion.img
              className="w-full"
              src={wordmarkVellum}
              alt="Dilettante"
              variants={fadeUp}
            />
          </h1>
          <div className="absolute top-[calc(100%+3.5rem)] right-0 left-0 flex justify-center">
            {/*
              CTA_SHELL is the teaser's button/input shell — shared so the two
              pages' CTAs can't drift apart.
            */}
            <motion.button
              type="button"
              onClick={onScrollDown}
              // Fill on hover rather than the teaser's opacity dip — `animate`
              // writes opacity inline, so a hover:opacity-* would never win.
              className={`${CTA_SHELL} max-w-[14rem] cursor-pointer justify-center transition-colors duration-200 hover:border-vellum-100 hover:bg-vellum-100 hover:text-inkwell-700 sm:max-w-[15rem]`}
              initial={reducedMotion ? false : {opacity: 0}}
              animate={{opacity: 1}}
              transition={
                reducedMotion
                  ? {duration: 0.01}
                  : {delay: CTA_DELAY, duration: 0.01}
              }
            >
              Explore Scents
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export function HomePage() {
  const reducedMotion = useReducedMotion();
  const [section, setSection] = useState(0);
  const sectionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const unlockedRef = useRef(true);
  const snapDirectionRef = useRef(0);
  const animatingRef = useRef(false);

  sectionRef.current = section;

  const goToSection = useCallback((index: number) => {
    const current = sectionRef.current;
    const target = Math.max(0, Math.min(SECTION_COUNT - 1, index));
    if (target === current || animatingRef.current) return;

    snapDirectionRef.current = Math.sign(target - current);
    animatingRef.current = true;
    unlockedRef.current = false;
    setSection(target);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    animatingRef.current = false;
    unlockedRef.current = true;
    snapDirectionRef.current = 0;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastWheelTime = 0;
    let lastWheelDelta = 0;
    let deltasDecaying = false;
    let gesturePending = false;
    let gestureAccum = 0;
    let gesturePeak = 0;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY === 0) return;

      const now = performance.now();
      const scale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const delta = Math.abs(event.deltaY) * scale;
      const lastDelta = Math.abs(lastWheelDelta);
      const isBoundary =
        now - lastWheelTime > GESTURE_GAP_MS ||
        Math.sign(event.deltaY) !== Math.sign(lastWheelDelta) ||
        (deltasDecaying && delta > lastDelta * GESTURE_GROWTH_FACTOR);
      deltasDecaying = isBoundary ? false : delta <= lastDelta;
      lastWheelTime = now;
      lastWheelDelta = event.deltaY * scale;

      if (isBoundary) {
        gesturePending = true;
        gestureAccum = 0;
        gesturePeak = 0;
      }
      if (!gesturePending) return;
      if (delta < gesturePeak * GESTURE_DECAY_CUTOFF) {
        gesturePending = false;
        return;
      }
      gestureAccum += delta;
      gesturePeak = Math.max(gesturePeak, delta);
      if (gestureAccum < GESTURE_TRIGGER_DELTA) return;
      gesturePending = false;

      const gestureDirection = event.deltaY > 0 ? 1 : -1;
      const reversesSnap =
        snapDirectionRef.current !== 0 &&
        gestureDirection !== snapDirectionRef.current;
      if (!unlockedRef.current && !reversesSnap) return;
      goToSection(sectionRef.current + gestureDirection);
    };

    let touchStartY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      if (Math.abs(delta) < 48) return;
      if (!unlockedRef.current) return;
      goToSection(sectionRef.current + (delta > 0 ? 1 : -1));
    };

    container.addEventListener('wheel', onWheel, {passive: false});
    container.addEventListener('touchstart', onTouchStart, {passive: true});
    container.addEventListener('touchend', onTouchEnd, {passive: true});

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [goToSection]);

  const transition = reducedMotion
    ? {duration: 0.01}
    : {duration: SNAP_DURATION_MS / 1000, ease: EASE};

  return (
    <div
      ref={containerRef}
      className="relative h-svh w-full overflow-hidden touch-none"
    >
      <motion.div
        className="w-full will-change-transform"
        style={{height: `${SECTION_COUNT * 100}svh`}}
        animate={{y: `-${section * 100}svh`}}
        transition={transition}
        onAnimationStart={() => {
          animatingRef.current = true;
          unlockedRef.current = false;
          window.setTimeout(() => {
            if (animatingRef.current) unlockedRef.current = true;
          }, SNAP_DURATION_MS * SNAP_UNLOCK_AT);
        }}
        onAnimationComplete={handleAnimationComplete}
      >
        <HomeHero onScrollDown={() => goToSection(1)} />
        <section className="h-svh w-full bg-vellum-100">
          <BrandIntro active={section === 1} />
        </section>
        <section id="scent-01" className="h-svh w-full bg-inkwell-800">
          <ScentFeature active={section === 2} />
        </section>
        <section id="scent-01-anatomy" className="h-svh w-full bg-inkwell-800">
          <ScentAnatomy active={section === 3} />
        </section>
      </motion.div>
    </div>
  );
}
