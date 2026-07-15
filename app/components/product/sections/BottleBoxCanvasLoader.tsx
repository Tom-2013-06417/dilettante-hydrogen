import {useEffect, useState, type ComponentType} from 'react';

type CanvasProps = {rotationY: number};

/**
 * Loads the Three.js canvas only in the browser so MiniOxygen SSR
 * never evaluates @react-three/fiber or its CJS scheduler dependency.
 */
export function BottleBoxCanvasLoader({rotationY}: CanvasProps) {
  const [Canvas, setCanvas] = useState<ComponentType<CanvasProps> | null>(
    null,
  );

  useEffect(() => {
    void import('./BottleBoxCanvas').then((mod) => {
      setCanvas(() => mod.default);
    });
  }, []);

  if (!Canvas) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-inkwell-800/5"
        aria-hidden
      />
    );
  }

  return <Canvas rotationY={rotationY} />;
}
