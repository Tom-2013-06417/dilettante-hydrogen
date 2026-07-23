/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Edges} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {useMemo, useRef, type MutableRefObject} from 'react';
import * as THREE from 'three';
import type {ScentTier, ScentTierId} from '~/lib/scentProfile';
import {
  tierLabelSide,
  type CubeAnchorPoint,
  type CubeAnchorsMap,
} from './cubeAnchors';
import {CylinderBlueprintOutline} from './CylinderBlueprintOutline';
import {bottleDimsForCube, PerfumeBottle} from './PerfumeBottle';

const SIZE = 1.2;
const HALF_H = SIZE / 2;
/** Assembled Y centers for the top / base halves */
const TOP_STACK_Y = HALF_H / 2;
const BASE_STACK_Y = -HALF_H / 2;

const {
  height: BOTTLE_H,
  bodyHeight: BOTTLE_BODY_H,
  capHeight: BOTTLE_CAP_H,
  bodyRadius: BOTTLE_R,
} = bottleDimsForCube(SIZE);
/**
 * Blind well in the base half: fits the bottle diameter, stops at the
 * half's mid-plane (does not punch through the bottom face).
 */
const HOLE_R = BOTTLE_R * 1.04;
const HOLE_DEPTH = HALF_H / 2;
/**
 * Air above/below the bottle when fully exploded. Inner faces of the
 * halves sit at ±(BOTTLE_H/2 + clearance), so the full bottle reads clear.
 */
const EXPLODE_CLEARANCE = 0.36;
const HALF_GAP = BOTTLE_H / 2 + EXPLODE_CLEARANCE;
const TOP_EXPLODE_Y = HALF_GAP;
const BASE_EXPLODE_Y = -HALF_GAP;

/** Flat unlit fill (matches page) + inkwell edge lines — no lighting */
const FILL = '#fff6e6'; // vellum-100
const EDGE = '#152015'; // inkwell-700

/**
 * Procedural halftone canvas — same hex colors as OutlineBox.
 */
function createHalftoneTexture({
  cell = 8,
  dotRadius = 1.35,
}: {
  cell?: number;
  dotRadius?: number;
}) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.fillStyle = FILL;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = EDGE;
  for (let y = cell / 2; y < size; y += cell) {
    for (let x = cell / 2; x < size; x += cell) {
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

/**
 * BoxGeometry maps every face to a full 0–1 UV square, which stretches
 * dots on non-square sides. Scale each face’s UVs to its aspect so circles
 * stay round and spacing matches across faces.
 */
function boxGeometryWithAspectUVs(
  width: number,
  height: number,
  depth: number,
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const uvAttr = geometry.getAttribute('uv');
  if (!(uvAttr instanceof THREE.BufferAttribute)) return geometry;

  // Face order in three.js BoxGeometry: +x, -x, +y, -y, +z, -z
  const faceSizes: [number, number][] = [
    [depth, height],
    [depth, height],
    [width, depth],
    [width, depth],
    [width, height],
    [width, height],
  ];

  for (let f = 0; f < 6; f++) {
    const [fw, fh] = faceSizes[f]!;
    const max = Math.max(fw, fh);
    const uScale = fw / max;
    const vScale = fh / max;
    for (let i = 0; i < 4; i++) {
      const vi = f * 4 + i;
      uvAttr.setXY(vi, uvAttr.getX(vi) * uScale, uvAttr.getY(vi) * vScale);
    }
  }

  uvAttr.needsUpdate = true;
  return geometry;
}

type PackagingCubeSceneProps = {
  /** Kept for API compatibility; outline style ignores photo maps. */
  textureUrl: string;
  tiers: [ScentTier, ScentTier, ScentTier];
  /** 0 = stacked halves / solid cube, 1 = fully exploded */
  explodeAmount: number;
  /** Solid packaging cube (assembled) */
  showSolid: boolean;
  /** Halves + bottle (replaces solid when splitting) */
  showLayers: boolean;
  scrollRotationY: number;
  /**
   * Element that owns the SVG/label overlay. Anchor coords are reported
   * relative to this element's bounding box.
   */
  stageElement: HTMLElement | null;
  onAnchorsChange: (anchors: CubeAnchorsMap) => void;
};

type AnchorRefs = MutableRefObject<
  Partial<Record<ScentTierId, THREE.Object3D | null>>
>;

/** Unlit box: page-matched fill + dark edge lines only (no lights). */
function OutlineBox({
  args,
  visible = true,
}: {
  args: [number, number, number];
  visible?: boolean;
}) {
  return (
    <mesh visible={visible}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={FILL} toneMapped={false} />
      <Edges threshold={1} color={EDGE} linewidth={1} />
    </mesh>
  );
}

/** Top half: vellum fill + dense inkwell halftone dots + edge outlines. */
function HalftoneOutlineBox({
  args,
  visible = true,
}: {
  args: [number, number, number];
  visible?: boolean;
}) {
  const [width, height, depth] = args;
  const geometry = useMemo(
    () => boxGeometryWithAspectUVs(width, height, depth),
    [depth, height, width],
  );
  const texture = useMemo(
    () => createHalftoneTexture({cell: 20, dotRadius: 5}),
    [],
  );

  return (
    <mesh visible={visible} geometry={geometry}>
      <meshBasicMaterial map={texture} toneMapped={false} />
      <Edges threshold={1} color={EDGE} linewidth={1} />
    </mesh>
  );
}

/**
 * Base-half body: continuous outer hull (no mid-face seam), plus an
 * internal cylindrical blind well whose floor is a circle that stops
 * inside the cube — it never extends out to the outer faces.
 */
function BaseHalfBody() {
  const collarGeo = useMemo(() => {
    const half = SIZE / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-half, -half);
    shape.lineTo(half, -half);
    shape.lineTo(half, half);
    shape.lineTo(-half, half);
    shape.closePath();

    const hole = new THREE.Path();
    hole.absarc(0, 0, HOLE_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: HOLE_DEPTH,
      bevelEnabled: false,
      curveSegments: 32,
    });
    // Extrude along +Z → rotate so depth runs downward (−Y) from the top face
    geo.rotateX(Math.PI / 2);
    geo.translate(0, HALF_H / 2, 0);
    return geo;
  }, []);

  const lowerH = HALF_H - HOLE_DEPTH;
  const holeFloorY = HALF_H / 2 - HOLE_DEPTH;

  return (
    <group>
      {/* Outer silhouette only — full half, so no mid-face seam lines */}
      <mesh>
        <boxGeometry args={[SIZE, HALF_H, SIZE]} />
        <meshBasicMaterial
          color={FILL}
          toneMapped={false}
          transparent
          opacity={0}
          depthWrite={false}
        />
        <Edges threshold={1} color={EDGE} linewidth={1} />
      </mesh>

      {/* Solid under the well — fill only, no edges */}
      <mesh position={[0, -HALF_H / 2 + lowerH / 2, 0]}>
        <boxGeometry args={[SIZE, lowerH, SIZE]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>

      {/* Collar around the well — fill only, no edges */}
      <mesh geometry={collarGeo}>
        <meshBasicMaterial
          color={FILL}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Circular recess floor — internal only, does not reach outer faces */}
      <mesh position={[0, holeFloorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[HOLE_R, 32]} />
        <meshBasicMaterial color={FILL} toneMapped={false} />
      </mesh>

      {/* Well outline: full opening + floor circles + side silhouettes */}
      <group position={[0, HALF_H / 2 - HOLE_DEPTH / 2, 0]}>
        <CylinderBlueprintOutline
          radius={HOLE_R}
          height={HOLE_DEPTH}
          color={EDGE}
          rimMode="full"
          fit="inner"
        />
      </group>
    </group>
  );
}

function CubeHalf({
  tierId,
  stackY,
  explodeY,
  explodeAmount,
  anchorRefs,
  withHole = false,
}: {
  tierId: ScentTierId;
  stackY: number;
  explodeY: number;
  explodeAmount: number;
  anchorRefs: AnchorRefs;
  withHole?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const side = tierLabelSide(tierId);
  const amountRef = useRef(explodeAmount);
  amountRef.current = explodeAmount;

  useFrame(() => {
    if (!groupRef.current) return;
    const t = amountRef.current;
    const targetY = stackY + explodeY * t;
    groupRef.current.position.x = 0;
    groupRef.current.position.z = 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.22,
    );
  }, -1);

  return (
    <group ref={groupRef} position={[0, stackY, 0]}>
      {withHole ? (
        <BaseHalfBody />
      ) : (
        <HalftoneOutlineBox args={[SIZE, HALF_H, SIZE]} />
      )}
      {/*
        Local −X face: with +Y (CCW) scroll spin, this side rotates into
        the camera, so attach points stay on the near side instead of
        riding the +Z face around to the back.
      */}
      <group
        ref={(node) => {
          anchorRefs.current[tierId] = node;
        }}
        position={[-SIZE * 0.5, 0, side === 'left' ? SIZE * 0.28 : SIZE * 0.12]}
      />
    </group>
  );
}

export function PackagingCubeScene({
  tiers,
  explodeAmount,
  showSolid,
  showLayers,
  scrollRotationY,
  stageElement,
  onAnchorsChange,
}: PackagingCubeSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const anchorRefs = useRef<
    Partial<Record<ScentTierId, THREE.Object3D | null>>
  >({});
  const projected = useRef(new THREE.Vector3());
  const {camera, size, gl} = useThree();

  useFrame(() => {
    if (!rootRef.current) return;

    const targetY = scrollRotationY;
    const targetX = 0.22 + scrollRotationY * 0.15;

    // Track scroll tightly — soft lerp was causing a catch-up pop on enter
    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      targetY,
      0.35,
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      targetX,
      0.35,
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      0,
      0.35,
    );
  }, -2);

  useFrame(() => {
    if (!showLayers || !stageElement) return;

    const stageRect = stageElement.getBoundingClientRect();
    const canvasRect = gl.domElement.getBoundingClientRect();
    const next: CubeAnchorsMap = {top: null, heart: null, base: null};

    for (const tier of tiers) {
      const obj = anchorRefs.current[tier.id];
      if (!obj) continue;

      obj.getWorldPosition(projected.current);
      projected.current.project(camera);

      if (projected.current.z > 1) continue;

      const canvasX = (projected.current.x * 0.5 + 0.5) * size.width;
      const canvasY = (-projected.current.y * 0.5 + 0.5) * size.height;
      const point: CubeAnchorPoint = {
        id: tier.id,
        x: canvasRect.left - stageRect.left + canvasX,
        y: canvasRect.top - stageRect.top + canvasY,
        side: tierLabelSide(tier.id),
      };
      next[tier.id] = point;
    }

    onAnchorsChange(next);
  });

  return (
    <group ref={rootRef}>
      <OutlineBox args={[SIZE, SIZE, SIZE]} visible={showSolid} />

      {showLayers ? (
        <>
          <CubeHalf
            tierId="top"
            stackY={TOP_STACK_Y}
            explodeY={TOP_EXPLODE_Y}
            explodeAmount={explodeAmount}
            anchorRefs={anchorRefs}
          />
          <CubeHalf
            tierId="base"
            stackY={BASE_STACK_Y}
            explodeY={BASE_EXPLODE_Y}
            explodeAmount={explodeAmount}
            anchorRefs={anchorRefs}
            withHole
          />
          {/* After both halves so bottle fill/outlines aren’t painted over mid-explode */}
          <group renderOrder={1}>
            <PerfumeBottle
              bodyHeight={BOTTLE_BODY_H}
              capHeight={BOTTLE_CAP_H}
              bodyRadius={BOTTLE_R}
              onAnchorRef={(node) => {
                anchorRefs.current.heart = node;
              }}
            />
          </group>
        </>
      ) : null}
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
