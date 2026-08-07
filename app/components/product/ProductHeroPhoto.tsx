import {Image} from '@shopify/hydrogen';
import {useLayoutEffect, useRef, useState} from 'react';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import {ProductHeroImageVeil} from '~/components/product/ProductHeroImageVeil';
import {fetchPriorityAttr} from '~/lib/fetchPriority';

/** Layout width hint for the top hero band (title overlay). */
export const HERO_BAND_IMAGE_SIZES = '(min-width: 768px) 680px, 100vw';

/** Side strip beside the short description — much narrower. */
export const HERO_STRIP_IMAGE_SIZES = '(min-width: 768px) 200px, 30vw';

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
 *
 * No `<link rel="preload">` — the image is in SSR HTML, so the preload
 * scanner already finds it. A separate responsive preload often picks a
 * different srcset candidate than the `<img>` and trips Chrome’s unused-
 * preload warning.
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
        {...fetchPriorityAttr(fetchPriority)}
        decoding="async"
        srcSetOptions={HERO_IMAGE_SRCSET}
        onLoad={() => setReady(true)}
      />
      {ready ? <ProductHeroImageVeil /> : null}
    </>
  );
}
