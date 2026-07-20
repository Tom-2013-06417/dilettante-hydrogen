import {motion, useReducedMotion, type Variants} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import wordmarkVellum from '~/assets/design/wordmark-vellum.png';
import heroLandscape from '~/assets/design/hero-landscape.jpg';
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
const SCROLL_MASK_ID = 'home-scroll-arrow-cutout';

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

const fadeIn: Variants = {
  hidden: {opacity: 0},
  show: (delay = 0) => ({
    opacity: 1,
    transition: {duration: 1.2, ease: 'easeOut', delay},
  }),
};

const fadeDown: Variants = {
  hidden: {opacity: 0, y: -10},
  show: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 1.7,
      duration: 0.75,
      ease: [0.55, 0, 0.35, 1.5],
    },
  },
};

function HomeHero({onScrollDown}: {onScrollDown: () => void}) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative flex h-svh w-full flex-col items-stretch overflow-hidden bg-inkwell-800">
      <motion.div
        className="relative flex h-[20%] w-full items-start bg-inkwell-800 lg:h-[15%]"
        variants={heroStagger}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
      >
        <h1 className="absolute bottom-0 left-1/2 z-10 w-[92%] max-w-160 -translate-x-1/2 translate-y-1/2">
          <motion.img
            className="w-full"
            src={wordmarkVellum}
            alt="Dilettante"
            variants={fadeUp}
          />
          <motion.span
            className="absolute left-0 right-0 top-[calc(100%+2rem)] flex flex-col text-center font-['trust-3a'] text-[15px] font-normal leading-5.5 tracking-[0.06em] text-vellum-100"
            variants={fadeIn}
            custom={0.35}
          >
            <span>Bespoke scents crafted by</span>
            <span>Paulo Pascua</span>
          </motion.span>
        </h1>
      </motion.div>
      <div className="relative min-h-0 w-full grow overflow-hidden">
        <motion.img
          className="absolute inset-0 h-full w-full object-cover"
          src={heroLandscape}
          alt=""
          initial={reducedMotion ? false : {opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 1.2, ease: 'easeOut'}}
        />
        <div className="absolute inset-0 flex items-start bg-inkwell-900/30" />
      </div>
      <motion.button
        type="button"
        aria-label="Scroll down"
        onClick={onScrollDown}
        className="group absolute bottom-32 left-1/2 flex h-14 w-14 flex-none -translate-x-1/2 cursor-pointer items-center justify-center rounded-[4px] transition-transform duration-200 ease-out hover:scale-110 active:scale-105"
        initial={reducedMotion ? false : {opacity: 0, y: 0}}
        animate={
          reducedMotion
            ? {opacity: 1}
            : {
                opacity: 1,
                y: [0, 16, 4, 0],
              }
        }
        transition={
          reducedMotion
            ? {duration: 0.01}
            : {
                opacity: {delay: 5.45, duration: 0.01},
                y: {
                  delay: 5.45,
                  duration: 0.9,
                  ease: 'easeInOut',
                  times: [0, 0.5, 0.9, 1],
                },
              }
        }
      >
        <svg
          className="absolute inset-0 h-full w-full text-vellum-100"
          viewBox="0 0 56 56"
          fill="none"
          aria-hidden="true"
        >
          <motion.rect
            x="0.5"
            y="0.5"
            width="55"
            height="55"
            rx="3.5"
            pathLength="1"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            initial={reducedMotion ? false : {pathLength: 0}}
            animate={{pathLength: 1}}
            transition={{
              delay: 1,
              duration: 0.7,
              ease: [0.45, 0, 0.55, 1],
            }}
          />
        </svg>
        <motion.svg
          className="h-6 w-6 text-vellum-100 group-active:invisible"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          variants={fadeDown}
          initial={reducedMotion ? false : 'hidden'}
          animate="show"
        >
          <path
            d="M12 5v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m19 12-7 7-7-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
        <svg
          className="absolute inset-0 h-full w-full text-vellum-100 opacity-0 transition-opacity duration-100 group-active:opacity-100"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <mask id={SCROLL_MASK_ID} maskUnits="userSpaceOnUse">
            <rect width="56" height="56" fill="white" />
            <g
              transform="translate(16 16)"
              fill="none"
              stroke="black"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </g>
          </mask>
          <rect
            width="56"
            height="56"
            rx="4"
            fill="currentColor"
            mask={`url(#${SCROLL_MASK_ID})`}
          />
        </svg>
      </motion.button>
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
