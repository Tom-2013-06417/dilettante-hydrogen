import {Image} from '@shopify/hydrogen';
import {motion, useReducedMotion} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {VhsSlide} from '~/lib/vhsMetafields';

const AUTO_ADVANCE_MS = 4000;
/** Exit crop + enter slam share the same gate speed. */
const GATE_MS = 90;
/** Empty bloomless beat between exit and enter. */
const GATE_GAP_MS = 80;

const BLOOM_OPACITY = 0.22;

/** Soft vellum glow for chrome (number + ticks) — slightly stronger than stage bloom. */
const CHROME_GLOW = `drop-shadow(0 0 6px rgb(255 246 230 / 0.4)) drop-shadow(0 0 14px rgb(255 246 230 / 0.28))`;

/** Soft rectangular vignette — projector soft-edge (no hard crop seam). */
const PROJECTOR_EDGE_FEATHER = [
  `linear-gradient(
    to right,
    transparent 0%,
    rgb(0 0 0 / 0.65) 0.4%,
    black 1.25%,
    black 98.75%,
    rgb(0 0 0 / 0.65) 99.6%,
    transparent 100%
  )`,
  `linear-gradient(
    to bottom,
    transparent 0%,
    rgb(0 0 0 / 0.65) 0.35%,
    black 1%,
    black 99%,
    rgb(0 0 0 / 0.65) 99.65%,
    transparent 100%
  )`,
].join(', ');

const PROJECTOR_FRAME_MASK = {
  WebkitMaskImage: PROJECTOR_EDGE_FEATHER,
  WebkitMaskComposite: 'source-in' as const,
  maskImage: PROJECTOR_EDGE_FEATHER,
  maskComposite: 'intersect' as const,
};

type VhsSectionProps = {
  slides: VhsSlide[];
};

type LayerMode = 'idle' | 'exit' | 'enter';

/**
 * Full-stage ambient glow. Uses a plain <img> (Hydrogen Image wrappers can
 * clip CSS blur) and paints behind the plate across the whole inkwell stage.
 */
function VhsStageBloom({slide, mode}: {slide: VhsSlide; mode: LayerMode}) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-0"
      initial={
        mode === 'enter'
          ? {opacity: 0}
          : mode === 'exit'
            ? {opacity: BLOOM_OPACITY, clipPath: 'inset(0 0% 0 0)'}
            : false
      }
      animate={
        mode === 'exit'
          ? {opacity: BLOOM_OPACITY, clipPath: 'inset(0 100% 0 0)'}
          : {opacity: BLOOM_OPACITY, clipPath: 'inset(0 0% 0 0)'}
      }
      transition={
        mode === 'enter' || mode === 'exit'
          ? {duration: GATE_MS / 1000, ease: 'linear'}
          : {duration: 0}
      }
      aria-hidden
    >
      <img
        src={slide.url}
        alt=""
        className="absolute top-1/2 left-1/2 h-[70vmax] w-[50vmax] max-w-none rounded-none object-cover"
        style={{
          filter: 'blur(64px) saturate(1.25)',
          transform: 'translate(-50%, -50%)',
        }}
        decoding="async"
      />
    </motion.div>
  );
}

function VhsSlideLayer({
  slide,
  mode,
  active,
}: {
  slide: VhsSlide;
  mode: LayerMode;
  active: boolean;
}) {
  return (
    <div className={`absolute inset-0 ${mode === 'enter' ? 'z-20' : 'z-10'}`}>
      {/*
        Soft-edge gate while settled / exiting. During enter the plate is
        unmasked so it can travel in from off-screen left.
      */}
      <div
        className={`relative z-10 h-full w-full ${
          mode === 'enter' ? '' : 'overflow-hidden'
        }`}
        style={mode === 'enter' ? undefined : PROJECTOR_FRAME_MASK}
      >
        <motion.div
          className="absolute inset-0 will-change-transform"
          initial={
            mode === 'enter'
              ? {x: '-100vw', clipPath: 'inset(0 0% 0 0)'}
              : mode === 'exit'
                ? {x: 0, clipPath: 'inset(0 0% 0 0)'}
                : false
          }
          animate={
            mode === 'exit'
              ? {x: 0, clipPath: 'inset(0 100% 0 0)'}
              : {x: 0, clipPath: 'inset(0 0% 0 0)'}
          }
          transition={
            mode === 'enter' || mode === 'exit'
              ? {duration: GATE_MS / 1000, ease: 'linear'}
              : {duration: 0}
          }
          aria-hidden={!active}
        >
          <Image
            data={{
              url: slide.url,
              altText: slide.altText,
              width: slide.width ?? 1200,
              height: slide.height ?? 1800,
            }}
            alt={active ? slide.altText : ''}
            className="h-full w-full rounded-none object-cover"
            sizes="(min-width: 1024px) 42rem, 70vw"
            loading="eager"
          />
        </motion.div>
      </div>
    </div>
  );
}

type Phase = 'idle' | 'exiting' | 'entering';

/**
 * Product VHS section. Below scent anatomy, a static soft crossfade from page
 * vellum into solid inkwell-900 — then a projector-gate slideshow.
 */
export function VhsSection({slides}: VhsSectionProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const [carouselActive, setCarouselActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<number | null>(null);

  const slideCount = slides.length;
  const label = String(index + 1).padStart(2, '0');

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCarouselActive(
          Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.55),
        );
      },
      {threshold: [0.55, 0.75, 1]},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advanceTo = useCallback(
    (next: number) => {
      if (slideCount <= 0) return;
      const target = ((next % slideCount) + slideCount) % slideCount;
      if (target === index && phase === 'idle') return;
      if (busyRef.current) return;

      if (reducedMotion) {
        setIndex(target);
        setOutgoing(null);
        setIncoming(null);
        setPhase('idle');
        return;
      }

      busyRef.current = true;
      setOutgoing(index);
      setIncoming(target);
      setPhase('exiting');
    },
    [index, phase, reducedMotion, slideCount],
  );

  const goTo = useCallback(
    (next: number) => {
      advanceTo(next);
    },
    [advanceTo],
  );

  useEffect(() => {
    if (phase !== 'exiting' || incoming == null) return;

    const timer = window.setTimeout(() => {
      setOutgoing(null);
      setIndex(incoming);
      setPhase('entering');
    }, GATE_MS + GATE_GAP_MS);

    return () => window.clearTimeout(timer);
  }, [phase, incoming]);

  useEffect(() => {
    if (phase !== 'entering') return;

    const timer = window.setTimeout(() => {
      setIncoming(null);
      setPhase('idle');
      busyRef.current = false;
    }, GATE_MS);

    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!carouselActive) return;
    if (slideCount <= 1) return;
    if (reducedMotion) return;
    if (phase !== 'idle') return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      advanceTo(index + 1);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [advanceTo, carouselActive, index, phase, reducedMotion, slideCount]);

  const outgoingSlide = outgoing != null ? slides[outgoing] : null;
  const currentSlide =
    phase === 'idle' || phase === 'entering' ? slides[index] : null;
  const currentMode: LayerMode = phase === 'entering' ? 'enter' : 'idle';
  const bloomSlide = outgoingSlide ?? currentSlide;
  const bloomMode: LayerMode = outgoingSlide
    ? 'exit'
    : currentMode === 'enter'
      ? 'enter'
      : 'idle';

  return (
    <div
      className="vhs-section relative w-full text-vellum-100"
      aria-label="VHS"
    >
      <div
        className="pointer-events-none relative h-svh w-full"
        style={{
          backgroundImage: `linear-gradient(
            to bottom,
            transparent 0%,
            rgb(8 13 8 / 0.08) 18%,
            rgb(8 13 8 / 0.22) 34%,
            rgb(8 13 8 / 0.45) 52%,
            rgb(8 13 8 / 0.72) 70%,
            rgb(8 13 8 / 0.92) 86%,
            rgb(8 13 8) 100%
          )`,
        }}
        aria-hidden
      />

      <div className="relative w-full overflow-hidden bg-inkwell-900">
        {/* Stage-level bloom — fills the inkwell field behind the plate */}
        {bloomSlide && !reducedMotion ? (
          <VhsStageBloom
            key={`bloom-${bloomSlide.id}-${bloomMode}`}
            slide={bloomSlide}
            mode={bloomMode}
          />
        ) : null}

        <div
          ref={stageRef}
          className="relative z-10 flex min-h-svh w-full flex-col items-center px-[15svw] py-10 sm:px-24 sm:py-12 lg:px-40"
        >
          {slideCount > 0 ? (
            <div className="flex w-full max-w-2xl flex-1 flex-col">
              <div className="mb-3 flex w-full shrink-0 items-end justify-between">
                <p
                  className="m-0 font-['trust-3a'] text-[12px] font-medium tracking-[0.04em] text-vellum-100 tabular-nums sm:text-[13px]"
                  style={{filter: CHROME_GLOW}}
                  aria-live="polite"
                >
                  <span className="sr-only">Slideshow</span>
                  {label}
                </p>
                {/* Fixed-height slot so grow/shrink never shifts the plate below. */}
                <ol className="m-0 flex h-7 list-none items-end gap-1.5 p-0">
                  {slides.map((slide, i) => {
                    const active = i === index;
                    return (
                      <li key={slide.id} className="flex h-full items-end">
                        <motion.button
                          type="button"
                          aria-label={`Slide ${i + 1} of ${slideCount}`}
                          aria-current={active ? 'true' : undefined}
                          onClick={() => goTo(i)}
                          className="block cursor-pointer border-0 p-0"
                          style={{filter: CHROME_GLOW}}
                          initial={false}
                          animate={{
                            height: active ? 18 : 12,
                            width: 2,
                            backgroundColor: active
                              ? 'rgb(255 246 230)'
                              : 'rgb(255 246 230 / 0.4)',
                          }}
                          transition={{
                            duration: 0.22,
                            ease: 'easeInOut',
                          }}
                        />
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="relative min-h-0 w-full flex-1">
                <div className="relative mx-auto aspect-2/3 h-full max-h-[clamp(42svh,70svh,78svh)] w-full">
                  {outgoingSlide ? (
                    <VhsSlideLayer
                      key={`out-${outgoingSlide.id}`}
                      slide={outgoingSlide}
                      mode="exit"
                      active={false}
                    />
                  ) : null}

                  {currentSlide ? (
                    <VhsSlideLayer
                      key={currentSlide.id}
                      slide={currentSlide}
                      mode={currentMode}
                      active
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-svh" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
