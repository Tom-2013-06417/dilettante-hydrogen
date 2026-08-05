import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {useCallback, useEffect, useRef, useState, type Ref, type RefObject} from 'react';
import type {ScentProfile} from '~/lib/scentProfile';
import {ClientOnly, PageContainer} from '~/components/shared';
import {CubeBlueprintAnnotations} from './CubeBlueprintAnnotations';
import {EMPTY_CUBE_ANCHORS, type CubeAnchorsMap} from './cubeAnchors';
import {PackagingCubeLoader} from './PackagingCubeLoader';
import {
  loadProductHalfCanvases,
  type ProductHalfCanvases,
} from './productHalfCrops';
import {
  DEG_150,
  easeExit,
  EXIT_FADE_START,
  leaveMark,
  PIN,
  SCRUB_END,
  TOTAL_VH,
} from './scentAnatomyTimeline';
import {ScenesCue} from './ScentAnatomyPin';

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

function smoothstep01(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as {current: T}).current = value;
}

/** Progress window for half separation (after PIN), eased with smoothstep. */
const EXPLODE_START = 0.03;
const EXPLODE_END = 0.16;
const DRAW_START = 0.08;
const DRAW_END = 0.2;

export function ScentNotesExplorer({
  scentProfile,
  productImageUrl,
  sectionRef,
  scenesSectionRef,
}: {
  scentProfile: ScentProfile;
  /** Shopify product / variant image for the base-half photo faces. */
  productImageUrl?: string | null;
  sectionRef?: Ref<HTMLElement | null>;
  /** Target for the SCENES down-arrow (VHS block). */
  scenesSectionRef?: RefObject<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const localRef = useRef<HTMLElement | null>(null);
  const anchorsRef = useRef(EMPTY_CUBE_ANCHORS);
  const [stageElement, setStageElement] = useState<HTMLElement | null>(null);
  const [halfCanvases, setHalfCanvases] = useState<ProductHalfCanvases | null>(
    null,
  );

  useEffect(() => {
    const url = productImageUrl || scentProfile.detailImage;
    if (!url) return;
    let cancelled = false;
    void loadProductHalfCanvases(url)
      .then((canvases) => {
        if (!cancelled) setHalfCanvases(canvases);
      })
      .catch(() => {
        if (!cancelled) setHalfCanvases(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productImageUrl, scentProfile.detailImage]);

  const setSectionRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      assignRef(sectionRef, node);
    },
    [sectionRef],
  );

  const [annotationDraw, setAnnotationDraw] = useState(0);
  // Halftone top + photo base are visible from first paint; explode only separates them.
  const showSolid = false;
  const showLayers = true;
  const scrollRotationYRef = useRef(reducedMotion ? DEG_150 * 0.35 : 0);
  const explodeAmountRef = useRef(reducedMotion ? 1 : 0);
  const annotationDrawRef = useRef(0);

  // Scrub only — exit runway is excluded so PIN / explode timing stay stable
  const {scrollYProgress} = useScroll({
    target: localRef,
    offset: ['start end', `${SCRUB_END} start`],
  });

  const mark = leaveMark();
  const {scrollYProgress: leaveProgress} = useScroll({
    target: localRef,
    offset: [`${mark} end`, `${mark} start`],
  });

  // Transform-only exit (sticky stays pinned) — ease-in lift + fade to inkwell
  const leaveY = useTransform(leaveProgress, (p) => {
    if (reducedMotion) return '0vh';
    return `${-easeExit(p) * 100}vh`;
  });
  // Keep vellum through most of the cube exit; fade to inkwell only at the end
  const vellumOpacity = useTransform(leaveProgress, (p) => {
    if (reducedMotion) return p > 0.5 ? 0 : 1;
    if (p <= EXIT_FADE_START) return 1;
    const t = (p - EXIT_FADE_START) / (1 - EXIT_FADE_START);
    return 1 - easeExit(t);
  });

  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, DEG_150]);

  const applyProgress = useCallback(
    (p: number) => {
      if (reducedMotion) {
        scrollRotationYRef.current = DEG_150 * 0.4;
        explodeAmountRef.current = 1;
        if (annotationDrawRef.current !== 1) {
          annotationDrawRef.current = 1;
          setAnnotationDraw(1);
        }
        return;
      }

      scrollRotationYRef.current = scrollRotateY.get();

      const explodeT = mapRange(
        p,
        PIN + EXPLODE_START,
        PIN + EXPLODE_END,
        0,
        1,
      );
      explodeAmountRef.current = smoothstep01(explodeT);

      const drawT = mapRange(p, PIN + DRAW_START, PIN + DRAW_END, 0, 1);
      const draw = smoothstep01(drawT);
      if (draw !== annotationDrawRef.current) {
        annotationDrawRef.current = draw;
        setAnnotationDraw(draw);
      }
    },
    [reducedMotion, scrollRotateY],
  );

  useMotionValueEvent(scrollYProgress, 'change', applyProgress);

  useEffect(() => {
    applyProgress(scrollYProgress.get());
  }, [applyProgress, scrollYProgress]);

  const onAnchorsChange = useCallback((anchors: CubeAnchorsMap) => {
    anchorsRef.current = anchors;
  }, []);

  return (
    <div
      ref={setSectionRef}
      id="scent-anatomy"
      className="relative z-10 w-full bg-inkwell-900 font-['trust-3a'] text-inkwell-700"
      style={{height: `${TOTAL_VH}vh`}}
    >
      {/*
        Sticky shell stays pinned through EXIT_VH. Content lifts via transform
        while vellum fades to inkwell — then VHS continues on the same black.

        Use dvh (not only svh) so the fade layers cover the full visual
        viewport; a short svh shell left a body-vellum strip at the bottom.
        Section fill is inkwell so any runway below the shell matches VHS.
      */}
      <div className="sticky top-0 z-10 h-dvh min-h-svh overflow-hidden">
        <div className="absolute inset-0 bg-inkwell-900" aria-hidden />
        <motion.div
          className="absolute inset-0 bg-vellum-paper"
          style={{opacity: vellumOpacity}}
          aria-hidden
        />

        <motion.div
          className="relative z-10 flex h-full flex-col"
          style={reducedMotion ? undefined : {y: leaveY}}
        >
          <PageContainer className="flex h-full flex-col">
            <div className="relative mx-auto h-full w-full max-w-4xl">
              <div
                ref={setStageElement}
                className="pointer-events-none absolute inset-0"
              >
                <CubeBlueprintAnnotations
                  tiers={scentProfile.tiers}
                  drawProgress={annotationDraw}
                  anchorsRef={anchorsRef}
                  stageElement={stageElement}
                  active={showLayers}
                />

                <div className="relative mx-auto h-full w-full max-w-[min(calc(100%-11rem),24rem)]">
                  <ClientOnly
                    fallback={
                      <div
                        className="flex h-full w-full items-center justify-center"
                        aria-hidden
                      />
                    }
                  >
                    <PackagingCubeLoader
                      halfCanvases={halfCanvases}
                      tiers={scentProfile.tiers}
                      explodeAmountRef={explodeAmountRef}
                      showSolid={showSolid}
                      showLayers={showLayers}
                      scrollRotationYRef={scrollRotationYRef}
                      stageElement={stageElement}
                      onAnchorsChange={onAnchorsChange}
                    />
                  </ClientOnly>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-4 pb-6 sm:pb-8">
                {scenesSectionRef ? (
                  <div className="pointer-events-auto">
                    <ScenesCue
                      scentSectionRef={localRef}
                      scenesSectionRef={scenesSectionRef}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </PageContainer>
        </motion.div>
      </div>
    </div>
  );
}
