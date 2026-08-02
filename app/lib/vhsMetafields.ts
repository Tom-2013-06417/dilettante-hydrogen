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
