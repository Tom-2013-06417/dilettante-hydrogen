/**
 * Product metafield custom.vhs_images — list.file_reference (images).
 */

export type VhsSlide = {
  id: string;
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
};

type MediaImageNode = {
  id?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
} | null;

/** Storefront shape from aliased `vhsImages: metafield(...)`. */
export type StorefrontVhsImagesMetafield = {
  type?: string | null;
  references?: {
    nodes: MediaImageNode[];
  } | null;
} | null;

/** Map list.file_reference MediaImage nodes into slideshow slides. */
export function parseVhsSlides(
  metafield: StorefrontVhsImagesMetafield | undefined,
): VhsSlide[] {
  const nodes = metafield?.references?.nodes;
  if (!nodes?.length) return [];

  const slides: VhsSlide[] = [];
  for (const node of nodes) {
    const image = node?.image;
    if (!node?.id || !image?.url) continue;
    slides.push({
      id: node.id,
      url: image.url,
      altText: image.altText || 'VHS still',
      width: image.width,
      height: image.height,
    });
  }
  return slides;
}

/**
 * Shopify CDN resize. Plate column is max-w-lg (32rem); sizes hint is a
 * touch generous for retina desktops. Bloom is heavily blurred so a tiny
 * source is enough.
 */
export function shopifyImageUrl(
  url: string,
  opts: {width: number; height?: number; crop?: string},
): string {
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(opts.width));
    if (opts.height != null) {
      u.searchParams.set('height', String(opts.height));
    }
    if (opts.crop) {
      u.searchParams.set('crop', opts.crop);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** Sharp plate — covers ~32–42rem @2–3x without pulling 4k masters. */
export const VHS_PLATE_WIDTH = 1800;
/** Soft bloom — tiny; blur hides any detail. */
export const VHS_BLOOM_WIDTH = 160;
