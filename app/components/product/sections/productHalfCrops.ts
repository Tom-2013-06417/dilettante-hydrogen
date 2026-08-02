import * as THREE from 'three';

export type ProductHalfCanvases = {
  top: HTMLCanvasElement;
  bottom: HTMLCanvasElement;
};

export type ProductHalfTextures = {
  topCrop: THREE.CanvasTexture;
  bottomCrop: THREE.CanvasTexture;
};

/**
 * Face textures bake at 512×256. Request slightly above that from Shopify
 * CDN so square-center crops stay sharp without pulling the full master
 * (~750KB+). 640 ≈ 6× smaller than the untransformed product photo.
 */
export const CUBE_FACE_SOURCE_WIDTH = 640;

/**
 * Append `width=` for Shopify CDN URLs. Local / bundled assets are unchanged.
 */
export function sizedCubeFaceImageUrl(
  url: string,
  width = CUBE_FACE_SOURCE_WIDTH,
): string {
  try {
    const parsed = new URL(
      url,
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://localhost',
    );
    if (
      parsed.hostname === 'cdn.shopify.com' ||
      parsed.hostname.endsWith('.shopify.com')
    ) {
      parsed.searchParams.set('width', String(width));
      return parsed.toString();
    }
  } catch {
    // non-URL / relative — leave as-is
  }
  return url;
}

/**
 * Square-center the source image, then split into top / bottom halves
 * (2:1) matching the packaging cube side-face aspect.
 */
export function bakeProductHalfCanvases(
  image: CanvasImageSource & {width: number; height: number},
): ProductHalfCanvases {
  const side = Math.min(image.width, image.height);
  const sx = (image.width - side) / 2;
  const sy = (image.height - side) / 2;
  const half = Math.max(1, Math.floor(side / 2));
  const outW = 512;
  const outH = 256;

  function bake(which: 'top' | 'bottom') {
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const srcY = which === 'top' ? sy : sy + half;
      ctx.drawImage(image, sx, srcY, side, half, 0, 0, outW, outH);
    }
    return canvas;
  }

  return {top: bake('top'), bottom: bake('bottom')};
}

export function canvasesToHalfTextures(
  canvases: ProductHalfCanvases,
): ProductHalfTextures {
  function toTex(canvas: HTMLCanvasElement) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  }
  return {topCrop: toTex(canvases.top), bottomCrop: toTex(canvases.bottom)};
}

/** Load a product image in the DOM (outside R3F) and bake half-crop canvases. */
export function loadProductHalfCanvases(
  url: string,
): Promise<ProductHalfCanvases> {
  const src = sizedCubeFaceImageUrl(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!img.width || !img.height) {
        reject(new Error('empty image'));
        return;
      }
      resolve(bakeProductHalfCanvases(img));
    };
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}
