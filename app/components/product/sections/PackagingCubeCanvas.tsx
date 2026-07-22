import {Canvas, useThree} from '@react-three/fiber';
import {Suspense, useLayoutEffect} from 'react';
import * as THREE from 'three';
import type {ScentTier} from '~/lib/scentProfile';
import type {CubeAnchorsMap} from './cubeAnchors';
import {PackagingCubeScene} from './PackagingCubeScene';

export type PackagingCubeCanvasProps = {
  textureUrl: string;
  tiers: [ScentTier, ScentTier, ScentTier];
  explodeAmount: number;
  showSolid: boolean;
  showLayers: boolean;
  scrollRotationY: number;
  stageElement: HTMLElement | null;
  onAnchorsChange: (anchors: CubeAnchorsMap) => void;
};

/**
 * Keep the cube's on-screen proportions matching the original square view
 * (constant horizontal FOV), while a taller canvas increases vertical FOV
 * so exploded layers have room without stretching the geometry.
 */
function FramingCamera({
  distance = 3.1,
  horizontalFovDeg = 42,
}: {
  distance?: number;
  horizontalFovDeg?: number;
}) {
  const size = useThree((state) => state.size);
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const aspect = size.width / Math.max(size.height, 1);
    const hFov = THREE.MathUtils.degToRad(horizontalFovDeg);
    const vFov = 2 * Math.atan(Math.tan(hFov / 2) / aspect);

    camera.fov = THREE.MathUtils.radToDeg(vFov);
    camera.aspect = aspect;
    camera.position.set(0, 0.15, distance);
    camera.updateProjectionMatrix();
  }, [camera, distance, horizontalFovDeg, size.height, size.width]);

  return null;
}

export default function PackagingCubeCanvas({
  textureUrl,
  tiers,
  explodeAmount,
  showSolid,
  showLayers,
  scrollRotationY,
  stageElement,
  onAnchorsChange,
}: PackagingCubeCanvasProps) {
  return (
    <Canvas
      camera={{position: [0, 0.15, 3.7], fov: 42}}
      gl={{antialias: true, alpha: false, toneMapping: THREE.NoToneMapping}}
      onCreated={({gl}) => {
        gl.setClearColor('#fff6e6', 1);
      }}
      flat
      className="h-full w-full touch-none"
      style={{width: '100%', height: '100%', display: 'block'}}
    >
      <Suspense fallback={null}>
        <FramingCamera distance={3.7} horizontalFovDeg={40} />
        <PackagingCubeScene
          textureUrl={textureUrl}
          tiers={tiers}
          explodeAmount={explodeAmount}
          showSolid={showSolid}
          showLayers={showLayers}
          scrollRotationY={scrollRotationY}
          stageElement={stageElement}
          onAnchorsChange={onAnchorsChange}
        />
      </Suspense>
    </Canvas>
  );
}
