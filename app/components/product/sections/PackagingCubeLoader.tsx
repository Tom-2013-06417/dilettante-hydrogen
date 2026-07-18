import {useEffect, useState, type ComponentType} from 'react';
import type {PackagingCubeCanvasProps} from './PackagingCubeCanvas';

export function PackagingCubeLoader(props: PackagingCubeCanvasProps) {
  const [Canvas, setCanvas] =
    useState<ComponentType<PackagingCubeCanvasProps> | null>(null);

  useEffect(() => {
    void import('./PackagingCubeCanvas').then((mod) => {
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

  return <Canvas {...props} />;
}
