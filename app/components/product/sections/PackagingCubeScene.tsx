/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Edges} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {useEffect, useMemo, useRef, type MutableRefObject} from 'react';
import * as THREE from 'three';
import type {ScentTier, ScentTierId} from '~/lib/scentProfile';
import {
  tierLabelSide,
  type CubeAnchorPoint,
  type CubeAnchorsMap,
} from './cubeAnchors';
import {CylinderBlueprintOutline} from './CylinderBlueprintOutline';
import {bottleDimsForCube, PerfumeBottle} from './PerfumeBottle';
import {
  canvasesToHalfTextures,
  type ProductHalfCanvases,
} from './productHalfCrops';

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

/** Flat unlit fill (matches page) — assembled cube before split */
const FILL = '#fff6e6'; // vellum-100
/** Packaging green — inkwell-700 */
const INKWELL = '#152015';
/** Cube / packaging edge outlines */
const EDGE = '#152015'; // inkwell-700
/** Halftone dots: inkwell at half strength over vellum */
const HALFTONE_DOT_RGBA = 'rgba(21, 32, 21, 0.5)';

/** Uniform comic-book screen — one size, one spacing, everywhere. */
const HALFTONE_DOT_RADIUS = 4.35;
/** Center-to-center spacing (125% of prior 9.5). */
const HALFTONE_SPACING = 11.875;

/**
 * Monotonous halftone: equal inkwell dots on a regular lattice over vellum.
 * No size / density / position jitter — a pure even print screen.
 */
function createHalftoneTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }

  ctx.fillStyle = FILL;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = HALFTONE_DOT_RGBA;

  const cols = Math.max(1, Math.round(size / HALFTONE_SPACING));
  const rows = Math.max(1, Math.round(size / HALFTONE_SPACING));
  const stepX = size / cols;
  const stepY = size / rows;
  const r = HALFTONE_DOT_RADIUS;

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + 0.5) * stepX;
      const y = (j + 0.5) * stepY;
      // Wrap copies so RepeatWrapping doesn’t flash a seam
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const px = x + ox * size;
          const py = y + oy * size;
          if (px < -r || py < -r || px > size + r || py > size + r) continue;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  texture.repeat.set(1, 1);
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

/**
 * Collar UVs: caps keep ExtrudeGeometry’s denser shape-space scale
 * (raw XZ as UV). Vertical well wall unwraps by arc-length + height so
 * dots stay round — planar mapping on a cylinder collapses into streaks.
 */
function applyCollarHalftoneUVs(geometry: THREE.BufferGeometry) {
  geometry.computeVertexNormals();
  const pos = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  if (
    !(pos instanceof THREE.BufferAttribute) ||
    !(normal instanceof THREE.BufferAttribute)
  ) {
    return geometry;
  }

  let uv = geometry.getAttribute('uv');
  if (!(uv instanceof THREE.BufferAttribute) || uv.count !== pos.count) {
    uv = new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2);
    geometry.setAttribute('uv', uv);
  }

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const ny = normal.getY(i);

    if (Math.abs(ny) > 0.55) {
      // Denser lid scale (pre–planar-match ExtrudeGeometry top UVs)
      uv.setXY(i, x, z);
      continue;
    }

    const radius = Math.hypot(x, z);
    if (Math.abs(radius - HOLE_R) < HOLE_R * 0.2) {
      // 1 UV ≡ 1 world unit — same denser scale as the caps
      uv.setXY(i, Math.atan2(z, x) * radius, y);
    } else {
      const nx = normal.getX(i);
      const nz = normal.getZ(i);
      if (Math.abs(nx) >= Math.abs(nz)) {
        uv.setXY(i, z, y);
      } else {
        uv.setXY(i, x, y);
      }
    }
  }

  uv.needsUpdate = true;
  return geometry;
}

type PackagingCubeSceneProps = {
  /** Pre-baked product image half-crops (loaded outside R3F). */
  halfCanvases: ProductHalfCanvases | null;
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

function InkwellSidePlanes({half}: {half: number}) {
  return (
    <>
      <mesh position={[0, 0, half + 0.002]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={INKWELL} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -half - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={INKWELL} toneMapped={false} />
      </mesh>
      <mesh position={[half + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={INKWELL} toneMapped={false} />
      </mesh>
      <mesh position={[-half - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial color={INKWELL} toneMapped={false} />
      </mesh>
    </>
  );
}

function PhotoSidePlanes({
  halfCanvases,
  half,
}: {
  halfCanvases: ProductHalfCanvases;
  half: number;
}) {
  const crops = useMemo(
    () => canvasesToHalfTextures(halfCanvases),
    [halfCanvases],
  );

  useEffect(() => {
    return () => {
      crops.topCrop.dispose();
      crops.bottomCrop.dispose();
    };
  }, [crops]);

  return (
    <>
      <mesh position={[0, 0, half + 0.002]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.topCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[0, 0, -half - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.topCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[half + 0.002, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.bottomCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh position={[-half - 0.002, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[SIZE, HALF_H]} />
        <meshBasicMaterial
          map={crops.bottomCrop}
          toneMapped={false}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
    </>
  );
}

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

/**
 * Top half: uniform vellum + inkwell-dot screen + light edge outlines.
 */
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
  const map = useHalftoneMap();

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh visible={visible} geometry={geometry}>
      <meshBasicMaterial map={map} toneMapped={false} />
      <Edges threshold={1} color={EDGE} linewidth={1} />
    </mesh>
  );
}

function useHalftoneMap() {
  const map = useMemo(() => createHalftoneTexture(), []);
  useEffect(() => {
    return () => {
      map.dispose();
    };
  }, [map]);
  return map;
}

/**
 * Base-half body: halftone inkwell top (hole + recess) + product-photo side walls.
 * Top image crop → ±Z faces; bottom crop → ±X faces.
 */
function BaseHalfBody({
  halfCanvases,
}: {
  halfCanvases: ProductHalfCanvases | null;
}) {
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
    applyCollarHalftoneUVs(geo);
    return geo;
  }, []);

  const halftoneMap = useHalftoneMap();

  const holeFloorY = HALF_H / 2 - HOLE_DEPTH;
  const half = SIZE / 2;
  /**
   * Keep the solid lower body’s top below the well floor so we never
   * z-fight a flat inkwell against the halftone disc on scroll.
   */
  const floorClearance = 0.006;
  const lowerTopY = holeFloorY - floorClearance;
  const lowerBottomY = -HALF_H / 2;
  const lowerBoxH = Math.max(0.01, lowerTopY - lowerBottomY);
  const lowerCenterY = (lowerTopY + lowerBottomY) / 2;

  return (
    <group>
      {/* Outer silhouette — edges only */}
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

      {/* Lower body under the well — same even screen as the floor */}
      <mesh position={[0, lowerCenterY, 0]}>
        <boxGeometry args={[SIZE * 0.998, lowerBoxH, SIZE * 0.998]} />
        <meshBasicMaterial map={halftoneMap} toneMapped={false} />
      </mesh>

      {/* Collar — denser Extrude-style lid UVs; cylinder unwrapped for dots */}
      <mesh geometry={collarGeo}>
        <meshBasicMaterial
          map={halftoneMap}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Circular recess floor — default circle UVs (denser screen) */}
      <mesh position={[0, holeFloorY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[HOLE_R, 48]} />
        <meshBasicMaterial map={halftoneMap} toneMapped={false} />
      </mesh>

      {/* Side walls: top crop on ±Z, bottom crop on ±X */}
      {halfCanvases ? (
        <PhotoSidePlanes halfCanvases={halfCanvases} half={half} />
      ) : (
        <InkwellSidePlanes half={half} />
      )}

      {/* Well outline — light lines on dense ink */}
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
  halfCanvases,
  withHole = false,
}: {
  tierId: ScentTierId;
  stackY: number;
  explodeY: number;
  explodeAmount: number;
  anchorRefs: AnchorRefs;
  halfCanvases: ProductHalfCanvases | null;
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
        <BaseHalfBody halfCanvases={halfCanvases} />
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
  halfCanvases,
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
            halfCanvases={halfCanvases}
          />
          <CubeHalf
            tierId="base"
            stackY={BASE_STACK_Y}
            explodeY={BASE_EXPLODE_Y}
            explodeAmount={explodeAmount}
            anchorRefs={anchorRefs}
            halfCanvases={halfCanvases}
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
