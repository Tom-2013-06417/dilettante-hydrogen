/**
 * Product metafield custom.secondary_image — file_reference (image).
 */

export type SecondaryImage = {
  id: string;
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
};

type MediaImageReference = {
  id?: string | null;
  image?: {
    url: string;
    altText?: string | null;
    width?: number | null;
    height?: number | null;
  } | null;
} | null;

/** Storefront shape from aliased `secondaryImage: metafield(...)`. */
export type StorefrontSecondaryImageMetafield = {
  type?: string | null;
  reference?: MediaImageReference;
} | null;

/** Map a single file_reference MediaImage into a usable image. */
export function parseSecondaryImage(
  metafield: StorefrontSecondaryImageMetafield | undefined,
): SecondaryImage | null {
  const node = metafield?.reference;
  const image = node?.image;
  if (!node?.id || !image?.url) return null;
  return {
    id: node.id,
    url: image.url,
    altText: image.altText || '',
    width: image.width,
    height: image.height,
  };
}
