/**
 * Fixed cart thumbnail side. Compact enough to leave text room, tall enough
 * to sit beside a two-line title. Keep in sync with --cart-line-media-size
 * and CartLineItem <Image>.
 */
export const CART_LINE_IMAGE_SIZE = 88;

/** Same query-param shape Hydrogen's Image shopifyLoader produces. */
export function shopifyCdnUrl(
  src: string,
  {
    width,
    height,
    crop,
  }: {
    width: number;
    height?: number;
    crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  },
) {
  // Storefront API image URLs are always absolute CDN links.
  const url = new URL(src);
  url.searchParams.set('width', String(Math.round(width)));
  if (height != null) {
    url.searchParams.set('height', String(Math.round(height)));
  }
  if (crop) url.searchParams.set('crop', crop);
  return url.href;
}
