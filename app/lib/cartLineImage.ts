/**
 * Cart line thumbnails are ~69px CSS; we request 72 so 1x/2x/3x densities stay
 * tiny. Must stay in sync with CartLineItem's <Image width/height>.
 */
export const CART_LINE_IMAGE_SIZE = 72;

/** Same query-param shape Hydrogen's Image shopifyLoader produces. */
export function shopifyCdnUrl(
  src: string,
  {
    width,
    height,
    crop,
  }: {width: number; height?: number; crop?: 'center' | 'top' | 'bottom' | 'left' | 'right'},
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

/** Density srcSet matching Hydrogen FixedWidthImage for CART_LINE_IMAGE_SIZE. */
export function cartLineImageSrcSet(src: string) {
  return [1, 2, 3]
    .map((density) => {
      const side = CART_LINE_IMAGE_SIZE * density;
      return `${shopifyCdnUrl(src, {
        width: side,
        height: side,
        crop: 'center',
      })} ${density}x`;
    })
    .join(', ');
}
