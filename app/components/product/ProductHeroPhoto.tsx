import {Image} from '@shopify/hydrogen';
import {useLayoutEffect, useRef, useState} from 'react';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {ProductHeroImageVeil} from '~/components/product/ProductHeroImageVeil';

/** Layout width hint for the top hero band (title overlay). */
export const HERO_BAND_IMAGE_SIZES =
  '(min-width: 768px) min(1100px, 85vw), 100vw';

/** Side strip beside the short description — much narrower. */
export const HERO_STRIP_IMAGE_SIZES = '(min-width: 768px) 20vw, 30vw';

/**
 * Cap CDN candidates at 1200w (~380KB vs ~750KB full master). Enough for the
 * short hero band + veil/title overlay; source images are typically ≤1600w.
 */
export const HERO_IMAGE_SRCSET = {
  intervals: 5,
  startingWidth: 400,
  incrementSize: 200,
  placeholderWidth: 200,
};

const HERO_PRELOAD_WIDTHS = [400, 600, 800, 1000, 1200] as const;

/** Build a Shopify CDN srcset for `<link rel="preload" as="image">`. */
export function heroImagePreloadSrcSet(url: string): string {
  return HERO_PRELOAD_WIDTHS.map((width) => {
    const parsed = new URL(url);
    parsed.searchParams.set('width', String(width));
    return `${parsed.toString()} ${width}w`;
  }).join(', ');
}

type ProductHeroPhotoProps = {
  image: NonNullable<ProductVariantFragment['image']>;
  alt: string;
  className: string;
  sizes: string;
  /** LCP slot should be high; the secondary strip can stay auto/low. */
  fetchPriority?: 'high' | 'low' | 'auto';
};

/**
 * Above-the-fold product photo: eager load, capped srcset, veil only after
 * decode so empty cache doesn’t flash vignette on blank space.
 */
export function ProductHeroPhoto({
  image,
  alt,
  className,
  sizes,
  fetchPriority = 'auto',
}: ProductHeroPhotoProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setReady(true);
    }
  }, [image.url]);

  return (
    <>
      <Image
        ref={imgRef}
        alt={alt}
        className={className}
        data={image}
        sizes={sizes}
        loading="eager"
        fetchPriority={fetchPriority}
        decoding="async"
        srcSetOptions={HERO_IMAGE_SRCSET}
        onLoad={() => setReady(true)}
      />
      {ready ? <ProductHeroImageVeil /> : null}
    </>
  );
}
