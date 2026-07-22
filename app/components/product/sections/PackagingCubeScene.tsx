/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Outlines} from '@react-three/drei';
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

/** Cel palette tuned to brand vellum + inkwell */
const FILL = '#f5e6c8'; // near vellum-200
const FILL_ALT = '#edd9b0'; // slightly deeper vellum
const OUTLINE = '#152015'; // inkwell-700
const OUTLINE_THICKNESS = 0.028;

type PackagingCubeSceneProps = {
  /** Kept for API compatibility; toolbox style is solid gray (no photo maps). */
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

/** 3-step nearest grayscale ramp for MeshToonMaterial banding. */
function useToonGradient() {
  const tex = useRef<THREE.DataTexture | null>(null);
  if (!tex.current) {
    const data = new Uint8Array([
      210, 185, 140, 255, // shadow — warm vellum
      235, 215, 175, 255, // mid
      255, 246, 230, 255, // light — vellum-100
    ]);
    const created = new THREE.DataTexture(data, 3, 1);
    created.magFilter = THREE.NearestFilter;
    created.minFilter = THREE.NearestFilter;
    created.needsUpdate = true;
    tex.current = created;
  }
  return tex.current;
}

function ToolboxMesh({
  args,
  color,
  gradientMap,
  visible = true,
}: {
  args: [number, number, number];
  color: string;
  gradientMap: THREE.DataTexture;
  visible?: boolean;
}) {
  return (
    <mesh castShadow={false} receiveShadow={false} visible={visible}>
      <boxGeometry args={args} />
      <meshToonMaterial color={color} gradientMap={gradientMap} />
      <Outlines
        thickness={OUTLINE_THICKNESS}
        color={OUTLINE}
        opacity={1}
        angle={Math.PI}
      />
    </mesh>
  );
}

function LayerSlab({
  tier,
  index,
  explodeAmount,
  anchorRefs,
  gradientMap,
}: {
  tier: ScentTier;
  index: number;
  explodeAmount: number;
  anchorRefs: MutableRefObject<
    Partial<Record<ScentTierId, THREE.Object3D | null>>
  >;
  gradientMap: THREE.DataTexture;
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
    // Follow scroll scrub closely for continuous feel
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
  });

  return (
    <group ref={groupRef} position={[0, STACK_Y[index], 0]}>
      <ToolboxMesh
        args={[SIZE, SLAB_H * 0.96, SIZE]}
        color={index % 2 === 0 ? FILL : FILL_ALT}
        gradientMap={gradientMap}
      />
      <group
        ref={(node) => {
          anchorRefs.current[tier.id] = node;
        }}
        position={[
          side === 'left' ? -SIZE * 0.22 : SIZE * 0.22,
          0,
          SIZE * 0.52,
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
  const gradientMap = useToonGradient();
  const anchorRefs = useRef<Partial<Record<ScentTierId, THREE.Object3D | null>>>(
    {},
  );
  const projected = useRef(new THREE.Vector3());
  const {camera, size, gl} = useThree();

  useFrame(() => {
    if (!rootRef.current) return;

    const targetY = scrollRotationY;
    const targetX = 0.22 + scrollRotationY * 0.15;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      targetY,
      0.12,
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      targetX,
      0.12,
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      0,
      0.14,
    );

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
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3.5, 5.5, 2.5]} intensity={1.35} />
      <directionalLight position={[-2.5, 1.5, -1.5]} intensity={0.25} />

      <group ref={rootRef}>
        <ToolboxMesh
          args={[SIZE, SIZE, SIZE]}
          color={FILL}
          gradientMap={gradientMap}
          visible={showSolid}
        />

        {showLayers
          ? tiers.map((tier, index) => (
              <LayerSlab
                key={tier.id}
                tier={tier}
                index={index}
                explodeAmount={explodeAmount}
                anchorRefs={anchorRefs}
                gradientMap={gradientMap}
              />
            ))
          : null}
      </group>
    </>
  );
}
/* eslint-enable react/no-unknown-property */
