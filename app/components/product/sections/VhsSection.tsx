import {Image} from '@shopify/hydrogen';
import {motion, useReducedMotion} from 'motion/react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {ProductPurchaseButton} from '~/components/product/ProductPurchaseButton';
import {fetchPriorityAttr} from '~/lib/fetchPriority';
import type {ScentProfile} from '~/lib/scentProfile';
import {
  shopifyImageUrl,
  VHS_BLOOM_WIDTH,
  VHS_PLATE_WIDTH,
  type VhsSlide,
} from '~/lib/vhsMetafields';
import {SCENES_OVERLAY_CLOSE_MS} from './scenesGate';
import {ProductNumberBadge, ProductTitle} from './ProductTitle';

const AUTO_ADVANCE_MS = 4000;
/** Exit crop + enter slam share the same gate speed. */
const GATE_MS = 90;
/** Empty bloomless beat between exit and enter. */
const GATE_GAP_MS = 80;
/** Horizontal swipe distance (px) before a slide change commits. */
const SWIPE_THRESHOLD_PX = 48;

const BLOOM_OPACITY = 0.22;

/** Cap srcset so mobile never races 3–4k masters (400…1800). */
const PLATE_SRCSET = {
  intervals: 8,
  startingWidth: 400,
  incrementSize: 200,
  placeholderWidth: 200,
} as const;

function plateUrl(url: string, width = VHS_PLATE_WIDTH) {
  // Match Hydrogen Image fluid srcset (`width` + default `crop=center`).
  return shopifyImageUrl(url, {width, crop: 'center'});
}

function bloomUrl(url: string) {
  return shopifyImageUrl(url, {width: VHS_BLOOM_WIDTH});
}

function prefetchPlate(url: string) {
  if (typeof window === 'undefined') return;
  // Warm the sizes mobile + retina typically pick from our capped srcset.
  for (const width of [1000, VHS_PLATE_WIDTH] as const) {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = plateUrl(url, width);
  }
}

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
  /** True once the overlay has been expanded — drives the staged reveal. */
  open: boolean;
  title: string;
  /** Parenthetical under the title, matching the hero treatment. */
  titleSubtitle?: string;
  scentProfile: ScentProfile;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  preorderEta?: ProductFragment['preorderEta'];
};

/** Beat between the first plate landing and the rest of the panel arriving. */
const CHROME_DELAY_MS = 260;
/** Never strand the panel empty on a slow or failed decode. */
const PLATE_DECODE_TIMEOUT_MS = 1200;

type LayerMode = 'idle' | 'exit' | 'enter';

/**
 * Full-stage ambient glow. Uses a plain <img> (Hydrogen Image wrappers can
 * clip CSS blur) and paints behind the plate across the whole inkwell stage.
 *
 * Size with lvh/lvw — not vmax. Chrome bar show/hide changes the larger
 * viewport axis; vmax bloom resize reads as a dark wipe sliding the stage.
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
        src={bloomUrl(slide.url)}
        alt=""
        className="absolute top-1/2 left-1/2 h-[70lvh] w-[50lvw] max-w-none rounded-none object-cover"
        style={{
          filter: 'blur(64px) saturate(1.25)',
          transform: 'translate(-50%, -50%)',
        }}
        decoding="async"
        loading="eager"
        {...fetchPriorityAttr('low')}
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
              // Cap reported width so Hydrogen filters srcset above plate max.
              // Omit height so CDN resize stays width-only (CSS object-cover crops).
              width: VHS_PLATE_WIDTH,
            }}
            alt={active ? slide.altText : ''}
            className="h-full w-full rounded-none object-cover"
            sizes="(min-width: 1024px) 42rem, (min-width: 640px) 55vw, 70vw"
            srcSetOptions={PLATE_SRCSET}
            loading="eager"
            {...fetchPriorityAttr(active ? 'high' : 'low')}
          />
        </motion.div>
      </div>
    </div>
  );
}

type Phase = 'idle' | 'exiting' | 'entering';

/**
 * Product scenes panel: solid inkwell-900 stage behind a projector-gate
 * slideshow, with the scent title and Purchase carried over from the hero.
 *
 * Sized to fill its parent (ScenesOverlay's fixed box) rather than the
 * viewport — the old lvh floor existed to stop a vellum wipe when Chrome’s bar
 * returned, and the overlay now owns that box.
 *
 * Reveal is staged: the first plate lands alone, then everything else follows a
 * beat later, so the expansion reads as a projector striking up.
 */
export function VhsSection({
  slides,
  open,
  title,
  titleSubtitle,
  scentProfile,
  selectedVariant,
  preorderEta,
}: VhsSectionProps) {
  const localSectionRef = useRef<HTMLElement | null>(null);
  const setSectionRef = useCallback((node: HTMLDivElement | null) => {
    localSectionRef.current = node;
  }, []);
  const busyRef = useRef(false);
  const swipeRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    locked: boolean | null;
  } | null>(null);
  const reducedMotion = useReducedMotion();
  /** Latch: mount bloom/plates only when near — avoids decode jank during scent anatomy. */
  const [mediaArmed, setMediaArmed] = useState(false);
  /** Staged reveal: first plate, then the rest of the panel. */
  const [plateReady, setPlateReady] = useState(false);
  const [chromeReady, setChromeReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [incoming, setIncoming] = useState<number | null>(null);

  const slideCount = slides.length;
  const label = String(index + 1).padStart(2, '0');

  // Arm media only once the VHS block is approaching — not on first paint.
  useEffect(() => {
    const el = localSectionRef.current;
    if (!el || mediaArmed) return;

    const arm = () => setMediaArmed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        arm();
        observer.disconnect();
      },
      {rootMargin: '50% 0px', threshold: 0},
    );
    observer.observe(el);

    // DevTools device mode can miss IO; scroll check is a reliable backup.
    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight * 1.5) {
        arm();
        observer.disconnect();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, {passive: true});
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [mediaArmed]);

  // Hold the panel empty until the first plate can actually paint. A
  // half-decoded image arriving with the expansion reads as a glitch, not a cut.
  useEffect(() => {
    if (!open || plateReady || slideCount === 0) return;

    let cancelled = false;
    const done = () => {
      if (!cancelled) setPlateReady(true);
    };

    const img = new window.Image();
    img.src = plateUrl(slides[0]!.url);
    if (typeof img.decode === 'function') {
      img.decode().then(done, done);
    } else {
      img.onload = done;
      img.onerror = done;
    }
    const timer = window.setTimeout(done, PLATE_DECODE_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, plateReady, slideCount, slides]);

  useEffect(() => {
    if (!plateReady) return;
    const timer = window.setTimeout(
      () => setChromeReady(true),
      CHROME_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [plateReady]);

  // Rewind after the CSS iris finishes collapsing so the plate stays painted
  // during the close (instant unmount mid-transition was the jank). The plate
  // is cached by then, so the next open is the same beat without a decode wait.
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => {
      setPlateReady(false);
      setChromeReady(false);
    }, SCENES_OVERLAY_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Prefetch after arming, on idle — don't fight the scent-anatomy scroll thread.
  useEffect(() => {
    if (!mediaArmed || slideCount === 0) return;

    let cancelled = false;
    let idleId = 0;
    let timeoutId = 0;

    const warm = () => {
      if (cancelled) return;
      prefetchPlate(slides[0]!.url);
      if (slides[1]) prefetchPlate(slides[1].url);
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        for (let i = 2; i < slides.length; i++) {
          prefetchPlate(slides[i]!.url);
        }
      }, 600);
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(warm, {timeout: 900});
    } else {
      timeoutId = window.setTimeout(warm, 120);
    }

    return () => {
      cancelled = true;
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
    };
  }, [mediaArmed, slideCount, slides]);

  // Keep neighbors warm while the carousel runs (auto + swipe either way).
  useEffect(() => {
    if (!chromeReady || slideCount <= 1) return;
    const next = slides[(index + 1) % slideCount];
    const prev = slides[(index - 1 + slideCount) % slideCount];
    if (next) prefetchPlate(next.url);
    if (prev && prev !== next) prefetchPlate(prev.url);
  }, [chromeReady, index, slideCount, slides]);

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

  const onPlatePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (slideCount <= 1 || busyRef.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        locked: null,
      };
    },
    [slideCount],
  );

  const onPlatePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) return;

      const dx = event.clientX - swipe.x;
      const dy = event.clientY - swipe.y;

      // Decide axis once the gesture has clear intent so vertical scroll wins.
      if (swipe.locked === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        swipe.locked = Math.abs(dx) > Math.abs(dy);
        if (!swipe.locked) {
          swipeRef.current = null;
          return;
        }
      }

      if (swipe.locked) {
        event.preventDefault();
      }
    },
    [],
  );

  const endPlatePointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) return;
      swipeRef.current = null;

      if (swipe.locked !== true) return;

      const dx = event.clientX - swipe.x;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;

      // Swipe left → next; swipe right → previous.
      goTo(index + (dx < 0 ? 1 : -1));
    },
    [goTo, index],
  );

  const onPlatePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const swipe = swipeRef.current;
      if (!swipe || swipe.pointerId !== event.pointerId) return;
      swipeRef.current = null;
    },
    [],
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
    if (!chromeReady) return;
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
  }, [advanceTo, chromeReady, index, phase, reducedMotion, slideCount]);

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
      ref={setSectionRef}
      id="scenes"
      className="vhs-section relative h-full w-full bg-inkwell-900 text-vellum-100"
      aria-label="Scenes"
    >
      <div className="relative h-full w-full overflow-hidden bg-inkwell-900">
        {/* Bloom + plates stay unmounted until near — heavy blur/decode fights sticky WebGL. */}
        {plateReady && bloomSlide && !reducedMotion ? (
          <VhsStageBloom
            key={`bloom-${bloomSlide.id}-${bloomMode}`}
            slide={bloomSlide}
            mode={bloomMode}
          />
        ) : null}

        <div className="relative z-10 flex h-full w-full flex-col items-center px-[15svw] py-8 sm:px-24 sm:py-10 lg:px-40">
          {slideCount > 0 ? (
            /* max-w-lg, not 2xl: the title plate and Purchase now share this
               column, and a wider one leaves the plate squat and letterboxed. */
            <div className="flex w-full max-w-lg flex-1 flex-col">
              <motion.div
                className="mb-3 flex w-full shrink-0 items-end justify-between"
                initial={false}
                animate={{opacity: chromeReady ? 1 : 0}}
                transition={{duration: 0.4, ease: 'easeOut'}}
              >
                {/*
                  The scent number takes the counter's slot — the tick marks
                  beside it already show which scene is up. The live region
                  keeps that readable to a screen reader, which the ticks alone
                  would not announce.
                */}
                <span className="text-vellum-100" style={{filter: CHROME_GLOW}}>
                  <ProductNumberBadge
                    number={scentProfile.number}
                    variant="plain"
                  />
                </span>
                <p className="sr-only m-0" aria-live="polite">
                  Scene {label} of {slideCount}
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
              </motion.div>

              {/*
                The plate sizes from its height, not its width: the title row
                below is shrink-0, and a width-driven aspect box overflows the
                column on short viewports and pushes Purchase off screen.
              */}
              <motion.div
                className="relative flex min-h-0 w-full flex-1 items-center justify-center"
                initial={false}
                animate={{opacity: plateReady ? 1 : 0}}
                transition={{duration: 0.35, ease: 'easeOut'}}
              >
                {/* max-h as a share of the slot, not an svh value: the slot is
                    what is left after the chrome and title rows, and that
                    differs enough between phone and desktop that a fixed
                    viewport unit over- or under-shoots at one end. */}
                <div
                  className="relative aspect-2/3 h-full max-h-[88%] w-auto max-w-full touch-pan-y select-none [&_img]:[-webkit-user-drag:none]"
                  onPointerDown={onPlatePointerDown}
                  onPointerMove={onPlatePointerMove}
                  onPointerUp={endPlatePointer}
                  onPointerCancel={onPlatePointerCancel}
                  role={slideCount > 1 ? 'group' : undefined}
                  aria-roledescription={slideCount > 1 ? 'carousel' : undefined}
                  aria-label={
                    slideCount > 1
                      ? `Scene ${index + 1} of ${slideCount}. Swipe left or right to change.`
                      : undefined
                  }
                >
                  {mediaArmed && outgoingSlide ? (
                    <VhsSlideLayer
                      key={`out-${outgoingSlide.id}`}
                      slide={outgoingSlide}
                      mode="exit"
                      active={false}
                    />
                  ) : null}

                  {mediaArmed && currentSlide ? (
                    <VhsSlideLayer
                      key={currentSlide.id}
                      slide={currentSlide}
                      mode={currentMode}
                      active
                    />
                  ) : null}
                </div>
              </motion.div>

              {/*
                Hero type, no furniture: the vellum plate and its dashed rules
                belong on paper, and the No. badge has moved up to the chrome
                row. Centred stack — the title is whitespace-nowrap by design,
                so a side-by-side row shoves Purchase off the edge on mobile.
              */}
              <motion.div
                /* gap-9 rather than something smaller: the title runs at
                   leading-[0.72], so its box bottom sits a good 10px above the
                   descenders and the measured gap reads much tighter than it
                   is. mt is the compensating pull back toward the plate. */
                className="mt-2 flex w-full shrink-0 flex-col items-center gap-9 overflow-visible text-center"
                initial={false}
                animate={{opacity: chromeReady ? 1 : 0}}
                transition={{duration: 0.4, ease: 'easeOut', delay: 0.06}}
              >
                <ProductTitle
                  variant="bare"
                  showNumber={false}
                  number={scentProfile.number}
                  title={title}
                  subtitle={titleSubtitle}
                />
                <ProductPurchaseButton
                  className="shrink-0"
                  tone="vellum"
                  selectedVariant={selectedVariant}
                  scentNumber={scentProfile.number}
                  preorderEta={preorderEta}
                />
              </motion.div>
            </div>
          ) : (
            <div className="h-full" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
