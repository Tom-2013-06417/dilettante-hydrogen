import {Image} from '@shopify/hydrogen';
import {useLayoutEffect, useRef, useState} from 'react';
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

/**
 * Narrow description strip: `src` is already ~display size (200px @2x) so the
 * first paint is the real image — no tiny placeholder then pop-in.
 */
export const HERO_STRIP_IMAGE_SRCSET = {
  intervals: 2,
  startingWidth: 400,
  incrementSize: 200,
  placeholderWidth: 400,
};

/** Variant featured image or custom.secondary_image — Hydrogen `<Image>` data. */
export type ProductHeroPhotoImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
  id?: string | null;
};

type ProductHeroPhotoProps = {
  image: ProductHeroPhotoImage;
  alt: string;
  className: string;
  sizes: string;
  /** Hero band and description strip both use `high` so they start together. */
  fetchPriority?: 'high' | 'low' | 'auto';
  srcSetOptions?: typeof HERO_IMAGE_SRCSET;
};

/**
 * Above-the-fold product photo: eager load, capped srcset, veil only after
 * decode so empty cache doesn’t flash vignette on blank space.
 *
 * Hero band: `fetchpriority=high` only — it’s early in the HTML, so the
 * preload scanner finds it. Description strip: same `high` on the `<img>`,
 * plus a matching `placeholderWidth` preload in product `meta` (it sits
 * later in the document).
 */
export function ProductHeroPhoto({
  image,
  alt,
  className,
  sizes,
  fetchPriority = 'auto',
  srcSetOptions = HERO_IMAGE_SRCSET,
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
        srcSetOptions={srcSetOptions}
        onLoad={() => setReady(true)}
      />
      {ready ? <ProductHeroImageVeil /> : null}
    </>
  );
}
