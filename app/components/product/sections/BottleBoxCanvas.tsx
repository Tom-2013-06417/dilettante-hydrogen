import {Canvas} from '@react-three/fiber';
import {BottleBoxScene} from './BottleBoxScene';

export default function BottleBoxCanvas({rotationY}: {rotationY: number}) {
  return (
    <Canvas
      camera={{position: [0, 0.1, 3.2], fov: 42}}
      gl={{antialias: true, alpha: true}}
      className="h-full w-full"
    >
      <BottleBoxScene rotationY={rotationY} />
    </Canvas>
  );
}
