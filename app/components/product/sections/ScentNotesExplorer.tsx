import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {ScentProfile} from '~/lib/scentProfile';
import {ClientOnly, PageContainer} from '~/components/shared';
import {CubeBlueprintAnnotations} from './CubeBlueprintAnnotations';
import {EMPTY_CUBE_ANCHORS, type CubeAnchorsMap} from './cubeAnchors';
import {PackagingCubeLoader} from './PackagingCubeLoader';

/**
 * Scroll timeline (progress 0 → 1 while the sticky stage is pinned):
 *  0.00–0.12  fade / scale in
 *  0.08–0.30  solid cube orbiting
 *  0.30–0.38  layers stacked
 *  0.38–0.50  explode
 *  0.48–0.58  draw annotations
 *  0.58–0.70  hold exploded + notes
 *  0.70–0.82  collapse + hide notes
 *  0.82–0.88  solid cube again
 *  0.88–1.00  fade out into next section
 */
const DEG_120 = (120 * Math.PI) / 180;

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

export function ScentNotesExplorer({
  scentProfile,
}: {
  scentProfile: ScentProfile;
}) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const anchorsRef = useRef(EMPTY_CUBE_ANCHORS);
  const [stageElement, setStageElement] = useState<HTMLElement | null>(null);

  const [scrollRotationY, setScrollRotationY] = useState(
    reducedMotion ? DEG_120 * 0.35 : 0,
  );
  const [explodeAmount, setExplodeAmount] = useState(0);
  const [annotationDraw, setAnnotationDraw] = useState(0);
  const [showSolid, setShowSolid] = useState(true);
  const [showLayers, setShowLayers] = useState(false);
  const [hint, setHint] = useState('Scroll');

  const {scrollYProgress} = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, DEG_120]);
  const stageOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.9, 1],
    [0, 1, 1, 0],
  );
  const stageScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.9, 1],
    [0.92, 1, 1, 0.96],
  );
  const stageY = useTransform(
    scrollYProgress,
    [0, 0.1, 0.9, 1],
    [36, 0, 0, -24],
  );

  const applyProgress = useCallback(
    (p: number) => {
      if (reducedMotion) {
        setScrollRotationY(DEG_120 * 0.4);
        setShowSolid(false);
        setShowLayers(true);
        setExplodeAmount(1);
        setAnnotationDraw(1);
        setHint('');
        return;
      }

      setScrollRotationY(scrollRotateY.get());

      const layersOn = p >= 0.3 && p <= 0.82;
      setShowLayers(layersOn);
      setShowSolid(!layersOn);

      let explode = 0;
      if (p < 0.38) explode = 0;
      else if (p < 0.5) explode = clamp01(mapRange(p, 0.38, 0.5, 0, 1));
      else if (p < 0.7) explode = 1;
      else if (p < 0.82) explode = clamp01(mapRange(p, 0.7, 0.82, 1, 0));
      else explode = 0;
      setExplodeAmount(explode);

      let draw = 0;
      if (p < 0.48) draw = 0;
      else if (p < 0.56) draw = clamp01(mapRange(p, 0.48, 0.56, 0, 1));
      else if (p < 0.68) draw = 1;
      else if (p < 0.76) draw = clamp01(mapRange(p, 0.68, 0.76, 1, 0));
      else draw = 0;
      setAnnotationDraw(draw);

      if (p < 0.12) setHint('Scroll');
      else if (p < 0.48) setHint('Scent anatomy');
      else if (p < 0.7) setHint('Top · Heart · Base');
      else if (p < 0.88) setHint('Scent anatomy');
      else setHint('');
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
    <section
      ref={sectionRef}
      id="scent-anatomy"
      className="relative h-[320vh] w-full bg-vellum-100 font-['trust-3a'] text-inkwell-700"
    >
      <div className="sticky top-0 h-svh overflow-x-clip">
        <PageContainer className="flex h-full flex-col">
          <motion.div
            className="mx-auto flex h-full w-full max-w-4xl flex-col"
            style={{
              opacity: stageOpacity,
              scale: stageScale,
              y: stageY,
            }}
          >
            <div className="relative z-2 flex shrink-0 items-center justify-between pt-6 sm:pt-8">
              <p className="text-[14px] font-medium tracking-[0.04em] text-inkwell-700">
                Scent anatomy
              </p>
              <p className="text-[12px] tracking-[0.06em] text-inkwell-700/55">
                {hint}
              </p>
            </div>

            <div
              ref={setStageElement}
              className="relative mx-auto min-h-0 w-full flex-1"
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
                      className="flex h-full w-full items-center justify-center bg-inkwell-800/5"
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

            <span className="relative z-2 mx-auto max-w-[36ch] shrink-0 pb-6 text-center text-[13px] italic leading-[1.6] tracking-[0.02em] text-inkwell-700/50 sm:pb-8">
              Top, heart, and base — the three registers that unfold as the
              scent settles on skin.
            </span>
          </motion.div>
        </PageContainer>
      </div>
    </section>
  );
}
