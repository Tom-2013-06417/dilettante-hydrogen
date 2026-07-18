import {Html, useTexture} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {ScentTier} from '~/lib/scentProfile';

export type CubePhase = 'cube' | 'resetting' | 'rows' | 'exploded';

const SIZE = 1.2;
const SLAB_H = SIZE / 3;
/** Assembled Y centers for top / heart / base */
const STACK_Y = [SLAB_H, 0, -SLAB_H] as const;
/** Exploded vertical offsets from stack */
const EXPLODE_Y = [0.72, 0, -0.72] as const;
const EXPLODE_X = [-0.12, 0.18, -0.08] as const;

type PackagingCubeSceneProps = {
  textureUrl: string;
  tiers: [ScentTier, ScentTier, ScentTier];
  phase: CubePhase;
  scrollRotationY: number;
};

function useConfiguredTexture(url: string) {
  const texture = useTexture(url);
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

function LayerNotes({
  notes,
  visible,
  side,
}: {
  notes: string[];
  visible: boolean;
  side: 'above' | 'below' | 'right';
}) {
  if (!visible) return null;

  const position: [number, number, number] =
    side === 'above'
      ? [0, SLAB_H * 0.55, 0]
      : side === 'below'
        ? [0, -SLAB_H * 0.55, 0]
        : [SIZE * 0.62, 0, 0];

  return (
    <Html
      position={position}
      center={side !== 'right'}
      zIndexRange={[5, 0]}
      style={{
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        textAlign: side === 'right' ? 'left' : 'center',
        fontFamily: 'config-mono-vf, ui-monospace, monospace',
        fontSize: '11px',
        letterSpacing: '0.06em',
        color: 'rgb(21 32 21)',
        lineHeight: 1.35,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
      }}
    >
      <ul style={{margin: 0, padding: 0, listStyle: 'none'}}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </Html>
  );
}

function LayerSlab({
  tier,
  index,
  phase,
}: {
  tier: ScentTier;
  index: number;
  phase: CubePhase;
}) {
  const texture = useConfiguredTexture(tier.image);
  const groupRef = useRef<THREE.Group>(null);
  const target = useMemo(() => {
    if (phase === 'exploded') {
      return {
        x: EXPLODE_X[index],
        y: STACK_Y[index] + EXPLODE_Y[index],
      };
    }
    return {x: 0, y: STACK_Y[index]};
  }, [index, phase]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      target.x,
      0.1,
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      target.y,
      0.1,
    );
  });

  const noteSide =
    index === 0 ? 'above' : index === 2 ? 'below' : ('right' as const);

  return (
    <group ref={groupRef} position={[0, STACK_Y[index], 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[SIZE, SLAB_H * 0.96, SIZE]} />
        <meshStandardMaterial map={texture} roughness={0.55} metalness={0.05} />
      </mesh>
      <LayerNotes
        notes={tier.notes}
        visible={phase === 'exploded'}
        side={noteSide}
      />
    </group>
  );
}

export function PackagingCubeScene({
  textureUrl,
  tiers,
  phase,
  scrollRotationY,
}: PackagingCubeSceneProps) {
  const cubeTexture = useConfiguredTexture(textureUrl);
  const rootRef = useRef<THREE.Group>(null);
  const showSolid = phase === 'cube' || phase === 'resetting';
  const showLayers = phase === 'rows' || phase === 'exploded';

  useFrame(() => {
    if (!rootRef.current) return;

    const targetY = phase === 'cube' ? scrollRotationY : 0;
    const targetX = phase === 'cube' ? 0.18 : 0;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      targetY,
      phase === 'resetting' ? 0.14 : 0.08,
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      targetX,
      phase === 'resetting' ? 0.14 : 0.08,
    );
    rootRef.current.rotation.z = THREE.MathUtils.lerp(
      rootRef.current.rotation.z,
      0,
      0.14,
    );
  });

  return (
    <>
      <ambientLight intensity={0.58} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.1} />
      <directionalLight position={[-2, 1, -2]} intensity={0.35} />

      <group ref={rootRef}>
        {/* Solid packaging cube */}
        <mesh castShadow receiveShadow visible={showSolid}>
          <boxGeometry args={[SIZE, SIZE, SIZE]} />
          <meshStandardMaterial
            map={cubeTexture}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>

        {/* Three scent layers in the same 3D space */}
        {showLayers
          ? tiers.map((tier, index) => (
              <LayerSlab
                key={tier.id}
                tier={tier}
                index={index}
                phase={phase}
              />
            ))
          : null}
      </group>
    </>
  );
}
