import * as THREE from 'three';

const TAM_SIZE = 256;

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

/** Solid black hatch lines on white; 3×3 wrap for seamless RepeatWrapping. */
function paintHatchBand(
  ctx: CanvasRenderingContext2D,
  size: number,
  angle: number,
  spacing: number,
  width: number,
  rand: () => number,
  skipChance: number,
) {
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  const extent = size * 1.6;
  const laneCount = Math.ceil(extent / spacing) + 2;

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = width;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';

  for (let lane = 0; lane < laneCount; lane++) {
    if (rand() < skipChance) continue;

    const across =
      (lane - laneCount * 0.5) * spacing + (rand() - 0.5) * spacing * 0.15;
    const along0 = -extent * 0.5 + rand() * 8;
    const along1 = extent * 0.5 - rand() * 8;
    const ang = angle + (rand() - 0.5) * 0.04;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const qx = px * across;
    const qy = py * across;

    const x0 = qx + ca * along0;
    const y0 = qy + sa * along0;
    const x1 = qx + ca * along1;
    const y1 = qy + sa * along1;

    const breakStroke = rand() < 0.18;
    const breakT = 0.35 + rand() * 0.3;
    const gap = 4 + rand() * 10;

    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const oxp = ox * size;
        const oyp = oy * size;
        if (!breakStroke) {
          ctx.beginPath();
          ctx.moveTo(x0 + oxp, y0 + oyp);
          ctx.lineTo(x1 + oxp, y1 + oyp);
          ctx.stroke();
          continue;
        }
        const mx = x0 + (x1 - x0) * breakT;
        const my = y0 + (y1 - y0) * breakT;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy) || 1;
        const gx = (dx / len) * gap * 0.5;
        const gy = (dy / len) * gap * 0.5;
        ctx.beginPath();
        ctx.moveTo(x0 + oxp, y0 + oyp);
        ctx.lineTo(mx - gx + oxp, my - gy + oyp);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + gx + oxp, my + gy + oyp);
        ctx.lineTo(x1 + oxp, y1 + oyp);
        ctx.stroke();
      }
    }
  }
}

/** Six nested tone maps (each level keeps prior strokes + adds a family). */
function buildToneCanvases(size: number): HTMLCanvasElement[] {
  const A45 = Math.PI * 0.25;
  const A135 = Math.PI * -0.25;
  const A0 = 0;
  const A90 = Math.PI * 0.5;

  // [angle, spacing, width, skipChance]
  const layers: [number, number, number, number][] = [
    [A45, 22, 0.7, 0.25],
    [A45, 14, 0.65, 0.1],
    [A135, 20, 0.7, 0.2],
    [A135, 12, 0.65, 0.08],
    [A0, 15, 0.6, 0.12],
    [A90, 12, 0.6, 0.08],
  ];

  const tones: HTMLCanvasElement[] = [];

  for (let level = 0; level < 6; level++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      tones.push(canvas);
      continue;
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const layerRand = mulberry32(0xc0ffee01);
    for (let L = 0; L <= level; L++) {
      const [angle, spacing, width, skip] = layers[L]!;
      paintHatchBand(ctx, size, angle, spacing, width, layerRand, skip);
    }

    tones.push(canvas);
  }

  return tones;
}

function packTonePair(
  a: HTMLCanvasElement,
  b: HTMLCanvasElement,
  c: HTMLCanvasElement,
  size: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const ia = a.getContext('2d')!.getImageData(0, 0, size, size).data;
  const ib = b.getContext('2d')!.getImageData(0, 0, size, size).data;
  const ic = c.getContext('2d')!.getImageData(0, 0, size, size).data;
  const out = ctx.createImageData(size, size);
  const d = out.data;

  for (let i = 0, p = 0; i < d.length; i += 4, p += 4) {
    d[i] = ia[p]!;
    d[i + 1] = ib[p]!;
    d[i + 2] = ic[p]!;
    d[i + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export type HatchTamMaps = {
  hatch0: THREE.CanvasTexture;
  hatch1: THREE.CanvasTexture;
};

/** Two RGB-packed TAM textures (6 nested tones, densest → sparsest). */
export function createHatchTamMaps(size = TAM_SIZE): HatchTamMaps {
  const tones = buildToneCanvases(size);
  return {
    hatch0: packTonePair(tones[5]!, tones[4]!, tones[3]!, size),
    hatch1: packTonePair(tones[2]!, tones[1]!, tones[0]!, size),
  };
}
