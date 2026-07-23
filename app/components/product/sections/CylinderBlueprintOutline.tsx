/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Line} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {useMemo, useRef, type Ref} from 'react';
import * as THREE from 'three';
import type {LineSegments2} from 'three-stdlib';

/** Match cube `<Edges linewidth={1} />` — fat lines, not thin GL lines. */
const LINE_WIDTH = 1;
/**
 * Push outlines just off the fill so they don’t z-fight.
 * Outer = outside a solid (bottle); inner = inside a cavity (hole).
 */
const OUTLINE_OUTER = 1.012;
const OUTLINE_INNER = 1 / OUTLINE_OUTER;
/** Segments along the camera-facing semicircle only */
const FRONT_RIM_SEGMENTS = 32;
/** Segments for a full horizontal circle (hole floors, etc.) */
const FULL_RIM_SEGMENTS = 64;

type Vec3Tuple = [number, number, number];
export type BlueprintRimMode = 'front' | 'full';
export type BlueprintFit = 'outer' | 'inner';

function outlineScale(fit: BlueprintFit) {
  return fit === 'inner' ? OUTLINE_INNER : OUTLINE_OUTER;
}

function floatsPerRim(mode: BlueprintRimMode) {
  const segments = mode === 'full' ? FULL_RIM_SEGMENTS : FRONT_RIM_SEGMENTS;
  return segments * 2 * 3;
}

/** Write a camera-facing semicircle; skips the far arc behind the bottle. */
function writeFrontRim(
  out: Float32Array,
  offset: number,
  radius: number,
  y: number,
  camX: number,
  camZ: number,
  fit: BlueprintFit = 'outer',
  segments = FRONT_RIM_SEGMENTS,
): number {
  const r = radius * outlineScale(fit);
  const lenSq = camX * camX + camZ * camZ;
  const camAngle = lenSq < 1e-8 ? 0 : Math.atan2(camZ, camX);
  let o = offset;
  for (let i = 0; i < segments; i++) {
    const a0 = camAngle - Math.PI / 2 + (i / segments) * Math.PI;
    const a1 = camAngle - Math.PI / 2 + ((i + 1) / segments) * Math.PI;
    out[o++] = Math.cos(a0) * r;
    out[o++] = y;
    out[o++] = Math.sin(a0) * r;
    out[o++] = Math.cos(a1) * r;
    out[o++] = y;
    out[o++] = Math.sin(a1) * r;
  }
  return o;
}

/** Full horizontal circle — used for hole floors so depth reads clearly. */
function writeFullRim(
  out: Float32Array,
  offset: number,
  radius: number,
  y: number,
  fit: BlueprintFit = 'outer',
  segments = FULL_RIM_SEGMENTS,
): number {
  const r = radius * outlineScale(fit);
  let o = offset;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    out[o++] = Math.cos(a0) * r;
    out[o++] = y;
    out[o++] = Math.sin(a0) * r;
    out[o++] = Math.cos(a1) * r;
    out[o++] = y;
    out[o++] = Math.sin(a1) * r;
  }
  return o;
}

function writeRim(
  mode: BlueprintRimMode,
  out: Float32Array,
  offset: number,
  radius: number,
  y: number,
  camX: number,
  camZ: number,
  fit: BlueprintFit = 'outer',
): number {
  return mode === 'full'
    ? writeFullRim(out, offset, radius, y, fit)
    : writeFrontRim(out, offset, radius, y, camX, camZ, fit);
}

function placeholderRimPoints(
  rimCount: number,
  mode: BlueprintRimMode = 'front',
): Vec3Tuple[] {
  const points: Vec3Tuple[] = [];
  const segs = mode === 'full' ? FULL_RIM_SEGMENTS : FRONT_RIM_SEGMENTS;
  const verts = rimCount * segs * 2;
  for (let i = 0; i < verts; i++) points.push([0, 0, 0]);
  return points;
}

function BlueprintLine({
  points,
  color,
  lineRef,
}: {
  points: ReadonlyArray<Vec3Tuple | THREE.Vector3>;
  color: string;
  lineRef?: Ref<LineSegments2>;
}) {
  return (
    <Line
      ref={lineRef}
      segments
      points={points}
      color={color}
      lineWidth={LINE_WIDTH}
      toneMapped={false}
      depthTest
      depthWrite={false}
      renderOrder={10}
      raycast={() => null}
    />
  );
}

function syncLinePositions(line: LineSegments2, positions: Float32Array) {
  line.geometry.setPositions(positions);
  line.geometry.attributes.instanceStart.needsUpdate = true;
  line.geometry.attributes.instanceEnd.needsUpdate = true;
  line.computeLineDistances();
}

/** Horizontal blueprint rim — front half by default, or a full circle. */
export function BlueprintRim({
  radius,
  y,
  color,
  mode = 'front',
  fit = 'outer',
}: {
  radius: number;
  y: number;
  color: string;
  mode?: BlueprintRimMode;
  fit?: BlueprintFit;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rimRef = useRef<LineSegments2>(null);
  const positionsRef = useRef(new Float32Array(floatsPerRim(mode)));
  const {camera} = useThree();
  const camLocal = useMemo(() => new THREE.Vector3(), []);
  const placeholder = useMemo(() => placeholderRimPoints(1, mode), [mode]);

  useFrame(() => {
    const group = groupRef.current;
    const rim = rimRef.current;
    if (!group || !rim) return;

    camLocal.copy(camera.position);
    group.worldToLocal(camLocal);

    const need = floatsPerRim(mode);
    if (positionsRef.current.length !== need) {
      positionsRef.current = new Float32Array(need);
    }
    const positions = positionsRef.current;
    positions.fill(0);
    writeRim(mode, positions, 0, radius, y, camLocal.x, camLocal.z, fit);
    syncLinePositions(rim, positions);
  });

  return (
    <group ref={groupRef}>
      <BlueprintLine points={placeholder} color={color} lineRef={rimRef} />
    </group>
  );
}

/**
 * Rims + two camera-tracked silhouette generators for a straight cylinder.
 * `rimMode="full"` draws complete circles (hole floors); `"front"` omits
 * the far arc (bottle). `fit="inner"` keeps lines inside a cavity.
 */
export function CylinderBlueprintOutline({
  radius,
  height,
  color,
  rimMode = 'front',
  fit = 'outer',
}: {
  radius: number;
  height: number;
  color: string;
  rimMode?: BlueprintRimMode;
  fit?: BlueprintFit;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rimRef = useRef<LineSegments2>(null);
  const sideRef = useRef<LineSegments2>(null);
  const rimPositionsRef = useRef(new Float32Array(floatsPerRim(rimMode) * 2));
  const sidePositionsRef = useRef(new Float32Array(12));
  const {camera} = useThree();
  const camLocal = useMemo(() => new THREE.Vector3(), []);
  const r = radius * outlineScale(fit);
  const halfH = height / 2;
  // Lift the floor rim slightly into the cavity so the ellipse isn’t buried
  const topY = halfH - (fit === 'inner' ? 0.002 : 0);
  const floorY = -halfH + (fit === 'inner' ? 0.004 : 0);

  const rimPlaceholder = useMemo(
    () => placeholderRimPoints(2, rimMode),
    [rimMode],
  );
  const sidePlaceholder = useMemo<Vec3Tuple[]>(
    () => [
      [0, topY, 0],
      [0, floorY, 0],
      [0, topY, 0],
      [0, floorY, 0],
    ],
    [floorY, topY],
  );

  useFrame(() => {
    const group = groupRef.current;
    const rims = rimRef.current;
    const side = sideRef.current;
    if (!group || !rims || !side) return;

    camLocal.copy(camera.position);
    group.worldToLocal(camLocal);

    const need = floatsPerRim(rimMode) * 2;
    if (rimPositionsRef.current.length !== need) {
      rimPositionsRef.current = new Float32Array(need);
    }
    const rimPositions = rimPositionsRef.current;
    rimPositions.fill(0);
    let o = writeRim(
      rimMode,
      rimPositions,
      0,
      radius,
      topY,
      camLocal.x,
      camLocal.z,
      fit,
    );
    writeRim(
      rimMode,
      rimPositions,
      o,
      radius,
      floorY,
      camLocal.x,
      camLocal.z,
      fit,
    );
    syncLinePositions(rims, rimPositions);

    const sidePositions = sidePositionsRef.current;
    sidePositions.fill(0);
    const lenSq = camLocal.x * camLocal.x + camLocal.z * camLocal.z;
    if (lenSq >= 1e-8) {
      const invLen = 1 / Math.sqrt(lenSq);
      const px = -camLocal.z * invLen * r;
      const pz = camLocal.x * invLen * r;

      sidePositions[0] = px;
      sidePositions[1] = topY;
      sidePositions[2] = pz;
      sidePositions[3] = px;
      sidePositions[4] = floorY;
      sidePositions[5] = pz;
      sidePositions[6] = -px;
      sidePositions[7] = topY;
      sidePositions[8] = -pz;
      sidePositions[9] = -px;
      sidePositions[10] = floorY;
      sidePositions[11] = -pz;
    }
    syncLinePositions(side, sidePositions);
  });

  return (
    <group ref={groupRef}>
      <BlueprintLine points={rimPlaceholder} color={color} lineRef={rimRef} />
      <BlueprintLine points={sidePlaceholder} color={color} lineRef={sideRef} />
    </group>
  );
}

type ProfilePoint = {r: number; y: number};

/**
 * Front rims at profile ends + camera-tracked silhouette curves.
 * Far-side rim arcs are omitted so the back of the bottle stays hidden.
 */
export function RevolvedBlueprintOutline({
  profile,
  color,
}: {
  profile: readonly ProfilePoint[];
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const rimRef = useRef<LineSegments2>(null);
  const sideRef = useRef<LineSegments2>(null);
  const {camera} = useThree();
  const camLocal = useMemo(() => new THREE.Vector3(), []);
  const pointCount = profile.length;
  const segmentCount = Math.max(0, pointCount - 1);

  const endRims = useMemo(() => {
    if (pointCount < 2) return [] as {r: number; y: number}[];
    const ends = [profile[0]!, profile[pointCount - 1]!];
    return ends
      .filter((p) => p.r >= 1e-6)
      .map((p, index) => ({
        r: p.r,
        // Nudge flat end rims off the coplanar fill face
        y: p.y + (index === 0 ? -0.002 : 0.002),
      }));
  }, [pointCount, profile]);

  const rimPositionsRef = useRef(
    new Float32Array(floatsPerRim('front') * Math.max(endRims.length, 1)),
  );
  const sidePositionsRef = useRef(
    new Float32Array(segmentCount * 2 * 2 * 3),
  );

  const rimPlaceholder = useMemo(
    () => placeholderRimPoints(Math.max(endRims.length, 1), 'front'),
    [endRims.length],
  );
  const sidePlaceholder = useMemo<Vec3Tuple[]>(() => {
    const points: Vec3Tuple[] = [];
    for (let i = 0; i < segmentCount * 2 * 2; i++) {
      points.push([0, 0, 0]);
    }
    return points;
  }, [segmentCount]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group || pointCount < 2) return;

    camLocal.copy(camera.position);
    group.worldToLocal(camLocal);

    const rims = rimRef.current;
    if (rims && endRims.length) {
      const need = floatsPerRim('front') * endRims.length;
      if (rimPositionsRef.current.length !== need) {
        rimPositionsRef.current = new Float32Array(need);
      }
      const rimPositions = rimPositionsRef.current;
      rimPositions.fill(0);
      let o = 0;
      for (const rim of endRims) {
        o = writeFrontRim(
          rimPositions,
          o,
          rim.r,
          rim.y,
          camLocal.x,
          camLocal.z,
        );
      }
      syncLinePositions(rims, rimPositions);
    }

    const side = sideRef.current;
    if (!side || segmentCount < 1) return;

    const needSide = segmentCount * 2 * 2 * 3;
    if (sidePositionsRef.current.length !== needSide) {
      sidePositionsRef.current = new Float32Array(needSide);
    }
    const positions = sidePositionsRef.current;
    positions.fill(0);

    const lenSq = camLocal.x * camLocal.x + camLocal.z * camLocal.z;
    if (lenSq >= 1e-8) {
      const invLen = 1 / Math.sqrt(lenSq);
      const ux = -camLocal.z * invLen;
      const uz = camLocal.x * invLen;
      let o = 0;

      const writeSide = (sign: number) => {
        for (let i = 0; i < segmentCount; i++) {
          const a = profile[i]!;
          const b = profile[i + 1]!;
          const ar = a.r * OUTLINE_OUTER;
          const br = b.r * OUTLINE_OUTER;
          positions[o++] = ux * ar * sign;
          positions[o++] = a.y;
          positions[o++] = uz * ar * sign;
          positions[o++] = ux * br * sign;
          positions[o++] = b.y;
          positions[o++] = uz * br * sign;
        }
      };

      writeSide(1);
      writeSide(-1);
    }

    syncLinePositions(side, positions);
  });

  return (
    <group ref={groupRef}>
      {endRims.length ? (
        <BlueprintLine points={rimPlaceholder} color={color} lineRef={rimRef} />
      ) : null}
      {segmentCount > 0 ? (
        <BlueprintLine
          points={sidePlaceholder}
          color={color}
          lineRef={sideRef}
        />
      ) : null}
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
