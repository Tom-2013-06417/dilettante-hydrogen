import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {useCallback, useEffect, useRef, useState, type Ref} from 'react';
import type {ScentProfile} from '~/lib/scentProfile';
import {ClientOnly, PageContainer} from '~/components/shared';
import {CubeBlueprintAnnotations} from './CubeBlueprintAnnotations';
import {EMPTY_CUBE_ANCHORS, type CubeAnchorsMap} from './cubeAnchors';
import {PackagingCubeLoader} from './PackagingCubeLoader';
import {DEG_150, PIN, SECTION_VH} from './scentAnatomyTimeline';

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

function assignRef<T>(ref: Ref<T> | undefined, value: T) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as {current: T}).current = value;
}

export function ScentNotesExplorer({
  scentProfile,
  sectionRef,
}: {
  scentProfile: ScentProfile;
  sectionRef?: Ref<HTMLElement | null>;
}) {
  const reducedMotion = useReducedMotion();
  const localRef = useRef<HTMLElement | null>(null);
  const anchorsRef = useRef(EMPTY_CUBE_ANCHORS);
  const [stageElement, setStageElement] = useState<HTMLElement | null>(null);

  const setSectionRef = useCallback(
    (node: HTMLElement | null) => {
      localRef.current = node;
      assignRef(sectionRef, node);
    },
    [sectionRef],
  );

  const [scrollRotationY, setScrollRotationY] = useState(
    reducedMotion ? DEG_150 * 0.35 : 0,
  );
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [annotationDraw, setAnnotationDraw] = useState(0);
  const [showSolid, setShowSolid] = useState(true);
  const [showLayers, setShowLayers] = useState(false);

  const {scrollYProgress} = useScroll({
    target: localRef,
    offset: ['start end', 'end start'],
  });

  // Cube keeps rotating through the whole stage, including the hold + scroll-away
  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, DEG_150]);

  const applyProgress = useCallback(
    (p: number) => {
      if (reducedMotion) {
        setScrollRotationY(DEG_150 * 0.4);
        setShowSolid(false);
        setShowLayers(true);
        setExplodeAmount(1);
        setAnnotationDraw(1);
        return;
      }

      setScrollRotationY(scrollRotateY.get());

      const layersOn = p >= PIN + 0.025;
      setShowLayers(layersOn);
      setShowSolid(!layersOn);

      let explode = 0;
      if (p < PIN + 0.04) explode = 0;
      else if (p < PIN + 0.1)
        explode = clamp01(mapRange(p, PIN + 0.04, PIN + 0.1, 0, 1));
      else explode = 1;
      setExplodeAmount(explode);

      let draw = 0;
      if (p < PIN + 0.08) draw = 0;
      else if (p < PIN + 0.13)
        draw = clamp01(mapRange(p, PIN + 0.08, PIN + 0.13, 0, 1));
      else draw = 1;
      setAnnotationDraw(draw);
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
      className="relative z-10 w-full font-['trust-3a'] text-inkwell-700"
      style={{height: `${SECTION_VH}vh`}}
    >
      <div className="sticky top-0 z-10 h-svh overflow-hidden">
        <div className="flex h-full flex-col bg-vellum-100">
          <PageContainer className="flex h-full flex-col">
            <div className="relative mx-auto h-full w-full max-w-4xl">
              <div
                ref={setStageElement}
                className="absolute inset-0"
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
                        className="flex h-full w-full items-center justify-center bg-vellum-100"
                        aria-hidden
                      />
                    }
                  >
                    <PackagingCubeLoader
                      textureUrl={scentProfile.detailImage}
                      tiers={scentProfile.tiers}
                      explodeAmount={explodeAmount}
                      showSolid={showSolid}
                      showLayers={showLayers}
                      scrollRotationY={scrollRotationY}
                      stageElement={stageElement}
                      onAnchorsChange={onAnchorsChange}
                    />
                  </ClientOnly>
                </div>
              </div>

              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-2 mx-auto max-w-[36ch] px-4 pb-6 text-center text-[13px] italic leading-[1.6] tracking-[0.02em] text-inkwell-700/50 sm:pb-8">
                Top, heart, and base — the three registers that unfold as the
                scent settles on skin.
              </span>
            </div>
          </PageContainer>
        </div>
      </div>
    </div>
  );
}
