/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Edges} from '@react-three/drei';
import {useFrame, useThree} from '@react-three/fiber';
import {useRef, type MutableRefObject} from 'react';
import * as THREE from 'three';
import type {ScentTier, ScentTierId} from '~/lib/scentProfile';
import {
  tierLabelSide,
  type CubeAnchorPoint,
  type CubeAnchorsMap,
} from './cubeAnchors';

const SIZE = 1.2;
const SLAB_H = SIZE / 3;
/** Assembled Y centers for top / heart / base */
const STACK_Y = [SLAB_H, 0, -SLAB_H] as const;
/** Exploded vertical offsets from stack */
const EXPLODE_Y = [0.38, 0, -0.38] as const;
const EXPLODE_X = [-0.06, 0.1, -0.04] as const;

/** Flat unlit fill (matches page) + inkwell edge lines — no lighting */
const FILL = '#fff6e6'; // vellum-100
const EDGE = '#152015'; // inkwell-700

type PackagingCubeSceneProps = {
  /** Kept for API compatibility; outline style ignores photo maps. */
  textureUrl: string;
  tiers: [ScentTier, ScentTier, ScentTier];
  /** 0 = stacked layers / solid cube, 1 = fully exploded */
  explodeAmount: number;
  /** Solid packaging cube (assembled) */
  showSolid: boolean;
  /** Layer slabs (replaces solid when splitting) */
  showLayers: boolean;
  scrollRotationY: number;
  /**
   * Element that owns the SVG/label overlay. Anchor coords are reported
   * relative to this element's bounding box.
   */
  stageElement: HTMLElement | null;
  onAnchorsChange: (anchors: CubeAnchorsMap) => void;
};

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

function LayerSlab({
  tier,
  index,
  explodeAmount,
  anchorRefs,
}: {
  tier: ScentTier;
  index: number;
  explodeAmount: number;
  anchorRefs: MutableRefObject<
    Partial<Record<ScentTierId, THREE.Object3D | null>>
  >;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const side = tierLabelSide(tier.id);
  const amountRef = useRef(explodeAmount);
  amountRef.current = explodeAmount;

  useFrame(() => {
    if (!groupRef.current) return;
    const t = amountRef.current;
    const targetX = EXPLODE_X[index] * t;
    const targetY = STACK_Y[index] + EXPLODE_Y[index] * t;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      0.22,
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY,
      0.22,
    );
  }, -1);

  return (
    <group ref={groupRef} position={[0, STACK_Y[index], 0]}>
      <OutlineBox args={[SIZE, SLAB_H, SIZE]} />
      {/*
        Local −X face: with +Y (CCW) scroll spin, this side rotates into
        the camera, so attach points stay on the near side instead of
        riding the +Z face around to the back.
      */}
      <group
        ref={(node) => {
          anchorRefs.current[tier.id] = node;
        }}
        position={[
          -SIZE * 0.5,
          0,
          side === 'left' ? SIZE * 0.28 : SIZE * 0.12,
        ]}
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
  const anchorRefs = useRef<Partial<Record<ScentTierId, THREE.Object3D | null>>>(
    {},
  );
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

      {showLayers
        ? tiers.map((tier, index) => (
            <LayerSlab
              key={tier.id}
              tier={tier}
              index={index}
              explodeAmount={explodeAmount}
              anchorRefs={anchorRefs}
            />
          ))
        : null}
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
