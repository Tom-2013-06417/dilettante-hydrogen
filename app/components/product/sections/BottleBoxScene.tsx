/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {useFrame} from '@react-three/fiber';
import {useRef} from 'react';
import * as THREE from 'three';

const INKWELL = '#1f3f1f';
const INKWELL_DARK = '#152015';
const INKWELL_LIGHT = '#2e5a2e';

function PerfumeBox({targetRotationY}: {targetRotationY: number}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotationY,
      0.08,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0.12,
      0.08,
    );
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.15, 1.75, 0.42]} />
        <meshStandardMaterial
          color={INKWELL}
          roughness={0.55}
          metalness={0.08}
        />
      </mesh>

      {/* Lid */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.17, 0.06, 0.44]} />
        <meshStandardMaterial color={INKWELL_DARK} roughness={0.7} />
      </mesh>

      {/* Front label panel */}
      <mesh position={[0, 0.05, 0.212]}>
        <planeGeometry args={[0.82, 1.05]} />
        <meshStandardMaterial color={INKWELL_LIGHT} roughness={0.85} />
      </mesh>
    </group>
  );
}

export function BottleBoxScene({rotationY}: {rotationY: number}) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.15} castShadow />
      <directionalLight position={[-2, 1, -2]} intensity={0.35} />
      <PerfumeBox targetRotationY={rotationY} />
    </>
  );
}
/* eslint-enable react/no-unknown-property */
