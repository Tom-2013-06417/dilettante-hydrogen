import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {STACK_ENTER_STATE} from '~/lib/constants';

/** Shopify product id for Forever — long admin title shortened for cards. */
const FOREVER_PRODUCT_ID = 'gid://shopify/Product/7998517837914';
const FOREVER_DISPLAY_TITLE = 'Forever';

export type CollectionProductCardProduct = {
  id: string;
  handle: string;
  title: string;
  featuredImage?: {
    id?: string | null;
    altText?: string | null;
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
  scentNumber?: {value?: string | null} | null;
  scentTagline?: {value?: string | null} | null;
};

type CollectionProductCardProps = {
  product: CollectionProductCardProduct;
  loading?: 'eager' | 'lazy';
};

export function CollectionProductCard({
  product,
  loading,
}: CollectionProductCardProps) {
  const isForever =
    product.handle === 'forever' || product.id === FOREVER_PRODUCT_ID;
  const title = isForever ? FOREVER_DISPLAY_TITLE : product.title;
  const number = product.scentNumber?.value?.trim() || '';
  const tagline = product.scentTagline?.value?.trim() || '';
  const image = product.featuredImage;

  return (
    <Link
      to={`/products/${product.handle}`}
      state={STACK_ENTER_STATE}
      prefetch="intent"
      className="collection-product-card relative mx-auto flex w-full items-stretch gap-3 bg-vellusum py-4 px-4 sm:gap-5 sm:px-5 sm:py-5"
    >
      <BlueprintRule
        orientation="h"
        variant="dotted"
        className="pointer-events-none absolute inset-x-0 top-4 z-0 text-inkwell-700/18"
      />
      <BlueprintRule
        orientation="v"
        variant="dotted"
        className="pointer-events-none absolute inset-y-0 left-4 z-0 text-inkwell-700/18"
      />
      <BlueprintRule
        orientation="v"
        variant="dotted"
        className="pointer-events-none absolute inset-y-0 right-4 z-0 text-inkwell-700/18"
      />
      <BlueprintRule
        orientation="h"
        variant="dotted"
        className="pointer-events-none absolute inset-x-0 bottom-4 z-0 text-inkwell-700/18"
      />

      <div className="z-1 flex w-[65%] min-w-0 shrink-0 flex-col justify-center">
        {number ? (
          <div className="my-2 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.02em]">
            No.
            <span className="flex h-3.5 w-7 items-center justify-center rounded-[50%] bg-inkwell-700 font-['config-mono-vf'] text-[11px] font-medium leading-none text-vellum-100 [font-variant-numeric:slashed-zero]">
              {number}
            </span>
          </div>
        ) : null}

        <div className="overflow-visible" aria-hidden>
          <BlueprintRule
            orientation="h"
            variant="dotted"
            className="pointer-events-none absolute inset-x-0 z-0 text-inkwell-700/18"
          />
          <span className="relative z-1 -mt-0.5 -mb-1 block wrap-break-word font-['wayfinder-cf'] text-[clamp(1.75rem,9vw,4.25rem)] font-light leading-[0.86] tracking-[-6%]">
            {title}
          </span>
          <BlueprintRule
            orientation="h"
            variant="dotted"
            className="pointer-events-none absolute inset-x-0 z-0 text-inkwell-700/18"
          />
        </div>

        {tagline ? (
          <span className="mt-3 font-['trust-3a'] text-[11px] font-normal leading-snug tracking-[0.01em] text-inkwell-700/75 sm:text-[12px]">
            {tagline}
          </span>
        ) : null}
      </div>

      <div className="relative z-2 min-w-0 flex-1 self-start -mt-4 sm:-mt-4">
        <div className="relative aspect-square w-full overflow-hidden bg-inkwell-700/10">
          {image ? (
            <Image
              alt={image.altText || title}
              className="h-full w-full object-cover"
              data={image}
              loading={loading}
              sizes="(min-width: 640px) 160px, 40vw"
              aspectRatio="1/1"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
