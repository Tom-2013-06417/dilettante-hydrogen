/* eslint-disable react/no-unknown-property -- R3F Three.js props */
import {Line} from '@react-three/drei';
import {useMemo} from 'react';
import * as THREE from 'three';

/** Same seeded RNG as hatchTam stroke generation. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const UNIT_CORNERS: [number, number, number][] = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
];

const UNIT_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

type StrokePoly = THREE.Vector3[];

/**
 * Cube edges drawn with the same stroke recipe as TAM hatch lines:
 * angle jitter, end shortening, lateral nudge, optional mid-stroke pen lift.
 */
export function HandDrawnBoxEdges({
  args,
  color,
  visible = true,
  lineWidth = 1,
}: {
  args: [number, number, number];
  color: string;
  visible?: boolean;
  lineWidth?: number;
}) {
  const [width, height, depth] = args;

  const strokes = useMemo(() => {
    const out: StrokePoly[] = [];
    const cornerA = new THREE.Vector3();
    const cornerB = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const side = new THREE.Vector3();
    const ref = new THREE.Vector3();
    const p0 = new THREE.Vector3();
    const p1 = new THREE.Vector3();
    const mid = new THREE.Vector3();
    const inflate = 1.004;

    for (let e = 0; e < UNIT_EDGES.length; e++) {
      const rand = mulberry32(0xc0ffee01 + e * 9973);
      const [ia, ib] = UNIT_EDGES[e]!;
      const ca = UNIT_CORNERS[ia]!;
      const cb = UNIT_CORNERS[ib]!;
      cornerA.set(
        ca[0] * width * inflate,
        ca[1] * height * inflate,
        ca[2] * depth * inflate,
      );
      cornerB.set(
        cb[0] * width * inflate,
        cb[1] * height * inflate,
        cb[2] * depth * inflate,
      );

      dir.subVectors(cornerB, cornerA);
      const edgeLen = dir.length();
      if (edgeLen < 1e-6) continue;
      dir.multiplyScalar(1 / edgeLen);

      ref.set(0, 1, 0);
      if (Math.abs(dir.dot(ref)) > 0.85) ref.set(1, 0, 0);
      side.crossVectors(dir, ref).normalize();

      // Match hatchTam: end shortening, angle jitter, lateral offset
      const trim0 = rand() * 0.03;
      const trim1 = rand() * 0.03;
      const angJitter = (rand() - 0.5) * 0.04;
      const lateral = (rand() - 0.5) * edgeLen * 0.012;

      p0.copy(cornerA).addScaledVector(dir, trim0 * edgeLen);
      p1.copy(cornerB).addScaledVector(dir, -trim1 * edgeLen);
      p0.addScaledVector(side, lateral);
      p1.addScaledVector(side, lateral);

      // Rotate stroke slightly around its midpoint (angle jitter)
      mid.lerpVectors(p0, p1, 0.5);
      const cos = Math.cos(angJitter);
      const sin = Math.sin(angJitter);
      const binorm = new THREE.Vector3().crossVectors(dir, side).normalize();

      function rotateAroundMid(p: THREE.Vector3) {
        const rel = p.clone().sub(mid);
        const along = rel.dot(dir);
        const across = rel.dot(side);
        p.copy(mid)
          .addScaledVector(dir, along * cos - across * sin)
          .addScaledVector(side, along * sin + across * cos)
          .addScaledVector(binorm, rel.dot(binorm));
      }
      rotateAroundMid(p0);
      rotateAroundMid(p1);

      // Same pen-lift break as paintHatchBand (~18%)
      const breakStroke = rand() < 0.18;
      if (!breakStroke) {
        out.push([p0.clone(), p1.clone()]);
        continue;
      }

      const breakT = 0.35 + rand() * 0.3;
      const gap = (0.02 + rand() * 0.04) * edgeLen;
      const mx = p0.x + (p1.x - p0.x) * breakT;
      const my = p0.y + (p1.y - p0.y) * breakT;
      const mz = p0.z + (p1.z - p0.z) * breakT;
      const strokeDir = new THREE.Vector3().subVectors(p1, p0);
      const strokeLen = strokeDir.length() || 1;
      strokeDir.multiplyScalar(1 / strokeLen);
      const halfGap = gap * 0.5;
      const g = strokeDir.clone().multiplyScalar(halfGap);

      out.push([p0.clone(), new THREE.Vector3(mx - g.x, my - g.y, mz - g.z)]);
      out.push([new THREE.Vector3(mx + g.x, my + g.y, mz + g.z), p1.clone()]);
    }

    return out;
  }, [depth, height, width]);

  return (
    <group visible={visible} renderOrder={2}>
      {strokes.map((points, i) => (
        <Line
          key={i}
          points={points}
          color={color}
          lineWidth={lineWidth}
          toneMapped={false}
        />
      ))}
    </group>
  );
}
/* eslint-enable react/no-unknown-property */
