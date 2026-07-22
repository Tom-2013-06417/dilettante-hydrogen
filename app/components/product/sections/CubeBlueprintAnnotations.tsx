import {useReducedMotion} from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from 'react';
import type {ScentTier, ScentTierId} from '~/lib/scentProfile';
import {
  tierLabelSide,
  type CubeAnchorPoint,
  type CubeAnchorsMap,
} from './cubeAnchors';

/** Space between the label's marker dot and where the line starts */
const GAP = 0;
/** Length of the horizontal run leaving the label before the elbow */
const H_RUN = 20;

type CubeBlueprintAnnotationsProps = {
  tiers: [ScentTier, ScentTier, ScentTier];
  /** 0–1 scrubbed by scroll (labels + stroke draw) */
  drawProgress: number;
  anchorsRef: RefObject<CubeAnchorsMap>;
  /** Same element the scene uses when projecting anchors */
  stageElement: HTMLElement | null;
  /** Keep the rAF loop alive while layers are visible */
  active: boolean;
};

type ElbowPoints = {
  ax1: number;
  ay1: number;
  ax2: number;
  ay2: number;
  bx: number;
  by: number;
};

function elbowPoints(
  startX: number,
  startY: number,
  anchor: CubeAnchorPoint,
): ElbowPoints {
  const bx = anchor.x;
  const by = anchor.y;

  if (anchor.side === 'left') {
    const ax1 = startX + GAP;
    const ax2 = Math.min(ax1 + H_RUN, bx);
    return {ax1, ay1: startY, ax2, ay2: startY, bx, by};
  }

  const ax1 = startX - GAP;
  const ax2 = Math.max(ax1 - H_RUN, bx);
  return {ax1, ay1: startY, ax2, ay2: startY, bx, by};
}

function pointsAttr({ax1, ay1, ax2, ay2, bx, by}: ElbowPoints) {
  return `${ax1} ${ay1} ${ax2} ${ay2} ${bx} ${by}`;
}

function TierLabel({
  tier,
  labelRef,
  markerRef,
  progress,
}: {
  tier: ScentTier;
  labelRef: (node: HTMLLIElement | null) => void;
  markerRef: (node: HTMLSpanElement | null) => void;
  progress: number;
}) {
  const side = tierLabelSide(tier.id);
  const onLeft = side === 'left';
  const opacity = Math.min(1, progress * 1.35);
  const x = (1 - Math.min(1, progress * 1.2)) * (onLeft ? -8 : 8);

  return (
    <li
      ref={labelRef}
      className="pointer-events-none flex max-w-44 flex-col items-center text-center"
      style={{opacity, transform: `translateX(${x}px)`}}
    >
      <span className="relative text-[11px] font-medium uppercase tracking-[0.12em] text-inkwell-700">
        {tier.label}
        <span
          ref={markerRef}
          className={`absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-inkwell-700/55 ${
            onLeft ? 'left-full ml-2' : 'right-full mr-2'
          }`}
          aria-hidden
        />
      </span>
      {tier.notes.length ? (
        <span className="mt-1 flex flex-col items-center gap-0 text-[11px] lowercase leading-tight tracking-[0.06em] text-inkwell-700/65">
          {tier.notes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </span>
      ) : null}
    </li>
  );
}

/**
 * Side labels + SVG elbow leaders, scrubbed by scroll `drawProgress`.
 */
export function CubeBlueprintAnnotations({
  tiers,
  drawProgress,
  anchorsRef,
  stageElement,
  active,
}: CubeBlueprintAnnotationsProps) {
  const reducedMotion = useReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const labelRefs = useRef<Partial<Record<ScentTierId, HTMLLIElement | null>>>(
    {},
  );
  const markerRefs = useRef<
    Partial<Record<ScentTierId, HTMLSpanElement | null>>
  >({});
  const lineRefs = useRef<
    Partial<Record<ScentTierId, SVGPolylineElement | null>>
  >({});
  const dotRefs = useRef<Partial<Record<ScentTierId, SVGCircleElement | null>>>(
    {},
  );
  const progressRef = useRef(drawProgress);
  progressRef.current = reducedMotion
    ? drawProgress > 0.5
      ? 1
      : 0
    : drawProgress;

  const setLabelRef = useCallback(
    (id: ScentTierId) => (node: HTMLLIElement | null) => {
      labelRefs.current[id] = node;
    },
    [],
  );

  const setMarkerRef = useCallback(
    (id: ScentTierId) => (node: HTMLSpanElement | null) => {
      markerRefs.current[id] = node;
    },
    [],
  );

  const syncLines = useCallback(() => {
    const stage = stageElement;
    const svg = svgRef.current;
    if (!stage || !svg) return;

    const stageRect = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${stageRect.width} ${stageRect.height}`);
    const progress = progressRef.current;

    for (const tier of tiers) {
      const marker = markerRefs.current[tier.id];
      const line = lineRefs.current[tier.id];
      const dot = dotRefs.current[tier.id];
      const anchors = anchorsRef.current;
      if (!anchors) continue;
      const anchor = anchors[tier.id];
      if (!marker || !line || !dot || !anchor) {
        if (line) line.setAttribute('points', '0 0 0 0 0 0');
        if (dot) {
          dot.setAttribute('cx', '0');
          dot.setAttribute('cy', '0');
          dot.setAttribute('opacity', '0');
        }
        continue;
      }

      const markerRect = marker.getBoundingClientRect();
      const startX =
        anchor.side === 'left'
          ? markerRect.right - stageRect.left
          : markerRect.left - stageRect.left;
      const startY = markerRect.top - stageRect.top + markerRect.height / 2;

      const elbow = elbowPoints(startX, startY, anchor);
      line.setAttribute('points', pointsAttr(elbow));

      const length =
        typeof line.getTotalLength === 'function' ? line.getTotalLength() : 0;
      if (length > 0) {
        line.style.strokeDasharray = `${length}`;
        line.style.strokeDashoffset = `${length * (1 - progress)}`;
      }
      line.style.opacity = progress > 0.02 ? '1' : '0';

      dot.setAttribute('cx', String(anchor.x));
      dot.setAttribute('cy', String(anchor.y));
      dot.setAttribute('opacity', String(Math.min(1, progress * 1.4)));
    }
  }, [anchorsRef, stageElement, tiers]);

  useLayoutEffect(() => {
    syncLines();
  }, [syncLines, drawProgress]);

  useEffect(() => {
    if (!active && progressRef.current < 0.02) return;

    let frame = 0;
    const tick = () => {
      syncLines();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, drawProgress, syncLines]);

  const leftTiers = tiers.filter((t) => tierLabelSide(t.id) === 'left');
  const rightTiers = tiers.filter((t) => tierLabelSide(t.id) === 'right');
  const labelProgress = reducedMotion
    ? drawProgress > 0.5
      ? 1
      : 0
    : drawProgress;
  const visible = labelProgress > 0.02;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-2"
      aria-hidden={!visible}
    >
      <ul className="absolute top-[8%] bottom-[10%] left-0 flex w-[min(30%,10rem)] flex-col items-end justify-evenly pl-1 sm:w-[min(28%,11rem)] sm:pl-3">
        {leftTiers.map((tier) => (
          <TierLabel
            key={tier.id}
            tier={tier}
            labelRef={setLabelRef(tier.id)}
            markerRef={setMarkerRef(tier.id)}
            progress={labelProgress}
          />
        ))}
      </ul>

      <ul className="absolute top-[8%] bottom-[10%] right-0 flex w-[min(30%,10rem)] flex-col items-start justify-evenly pr-1 sm:w-[min(28%,11rem)] sm:pr-3">
        {rightTiers.map((tier) => (
          <TierLabel
            key={tier.id}
            tier={tier}
            labelRef={setLabelRef(tier.id)}
            markerRef={setMarkerRef(tier.id)}
            progress={labelProgress}
          />
        ))}
      </ul>

      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full overflow-visible text-inkwell-700/35"
        aria-hidden
      >
        {tiers.map((tier) => (
          <g key={tier.id}>
            <polyline
              ref={(node) => {
                lineRefs.current[tier.id] = node;
              }}
              fill="none"
              stroke="currentColor"
              strokeOpacity={1}
              strokeWidth={1}
              strokeLinejoin="miter"
            />
            <circle
              ref={(node) => {
                dotRefs.current[tier.id] = node;
              }}
              r={2.25}
              fill="currentColor"
              opacity={0}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
