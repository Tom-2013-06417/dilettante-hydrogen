import {
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from 'motion/react';
import {useCallback, useRef, useState} from 'react';
import type {ScentProfile} from '~/lib/scentProfile';
import {ClientOnly, PageContainer} from '~/components/shared';
import type {CubePhase} from './PackagingCubeScene';
import {PackagingCubeLoader} from './PackagingCubeLoader';

const EASE = [0.32, 0.72, 0, 1] as const;
const DEG_60 = (60 * Math.PI) / 180;
const RESET_MS = 720;
const ROWS_MS = 650;
const EXPLODE_SETTLE_MS = 800;

const sectionReveal: Variants = {
  hidden: {opacity: 0, y: 48},
  show: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.9, ease: EASE},
  },
};

function phaseHint(phase: CubePhase) {
  switch (phase) {
    case 'cube':
      return 'Tap to unfold';
    case 'resetting':
    case 'rows':
      return '';
    case 'exploded':
      return 'Tap to reset';
  }
}

export function ScentNotesExplorer({scentProfile}: {scentProfile: ScentProfile}) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, {once: true, margin: '-10% 0px'});
  const [phase, setPhase] = useState<CubePhase>('cube');
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollRotationY, setScrollRotationY] = useState(
    reducedMotion ? DEG_60 * 0.4 : 0,
  );

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, DEG_60]);

  useMotionValueEvent(scrollRotateY, 'change', (value) => {
    if (phase === 'cube' && !reducedMotion) setScrollRotationY(value);
  });

  const resetToCube = useCallback(() => {
    setIsAnimating(false);
    setPhase('cube');
    if (!reducedMotion) {
      setScrollRotationY(scrollRotateY.get());
    }
  }, [reducedMotion, scrollRotateY]);

  const unfold = useCallback(() => {
    if (isAnimating || phase !== 'cube') return;
    setIsAnimating(true);

    if (reducedMotion) {
      setPhase('exploded');
      setIsAnimating(false);
      return;
    }

    setPhase('resetting');
    window.setTimeout(() => {
      setPhase('rows');
      window.setTimeout(() => {
        setPhase('exploded');
        window.setTimeout(() => setIsAnimating(false), EXPLODE_SETTLE_MS);
      }, ROWS_MS);
    }, RESET_MS);
  }, [isAnimating, phase, reducedMotion]);

  const handleTap = useCallback(() => {
    if (phase === 'cube') {
      unfold();
      return;
    }
    if (phase === 'exploded' && !isAnimating) {
      resetToCube();
    }
  }, [isAnimating, phase, resetToCube, unfold]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] w-full overflow-x-clip bg-vellum-100 font-['trust-3a'] text-inkwell-700"
    >
      <PageContainer className="flex h-full flex-col">
        <motion.div
          className="mx-auto flex h-full w-full max-w-xl flex-col"
          variants={sectionReveal}
          initial={reducedMotion ? false : 'hidden'}
          animate={inView || reducedMotion ? 'show' : 'hidden'}
        >
          <div className="relative z-20 flex shrink-0 items-center justify-between pt-6 sm:pt-8">
            <p className="text-[14px] font-[700] tracking-[0.04em]">
              Scent anatomy
            </p>
            <p className="text-[12px] tracking-[0.06em] text-inkwell-700/55">
              {phaseHint(phase)}
            </p>
          </div>

          {/* Tall viewport, original cube width — FramingCamera keeps proportions correct */}
          <div className="relative mx-auto min-h-0 w-full max-w-[min(100%,22rem)] flex-1">
            <ClientOnly
              fallback={
                <div
                  className="flex h-full w-full items-center justify-center bg-inkwell-800/5"
                  aria-hidden
                />
              }
            >
              <PackagingCubeLoader
                textureUrl={scentProfile.detailImage}
                tiers={scentProfile.tiers}
                phase={phase}
                scrollRotationY={scrollRotationY}
              />
            </ClientOnly>
            <button
              type="button"
              onClick={handleTap}
              disabled={
                isAnimating || (phase !== 'cube' && phase !== 'exploded')
              }
              aria-label={
                phase === 'cube'
                  ? 'Unfold packaging into scent layers'
                  : 'Reset to packaging cube'
              }
              className="absolute inset-0 z-10 border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-inkwell-700 disabled:cursor-default enabled:cursor-pointer"
            />
          </div>

          <p className="relative z-20 max-w-[36ch] shrink-0 pb-6 text-[13px] italic leading-[1.6] tracking-[0.02em] text-inkwell-700/50 sm:pb-8">
            Top, heart, and base — the three registers that unfold as the scent
            settles on skin.
          </p>
        </motion.div>
      </PageContainer>
    </section>
  );
}
