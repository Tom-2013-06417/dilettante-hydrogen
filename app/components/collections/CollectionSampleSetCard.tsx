import {Image, Money} from '@shopify/hydrogen';
import {Link, useRouteLoaderData} from 'react-router';
import type {DiscoverySetVariantFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {
  PURCHASE_BUTTON_CLASS,
  PURCHASE_BUTTON_TONE_CLASS,
} from '~/components/product/ProductPurchaseButton';
import {STACK_ENTER_STATE} from '~/lib/constants';
import {
  isVariantPurchasable,
  preordersEnabledFromRootData,
} from '~/lib/preordersEnabled';
import {
  DISCOVERY_SET_FOOTNOTE,
  DISCOVERY_SET_TAGLINE,
  DISCOVERY_SET_TITLE,
} from '~/lib/sampleSet';
import type {loader as rootLoader} from '~/root';

export type CollectionDiscoverySetCardImage = {
  id?: string | null;
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

type CollectionSampleSetCardProps = {
  /** Discovery Set product featured image. */
  image: CollectionDiscoverySetCardImage | null;
  selectedVariant: DiscoverySetVariantFragment | null;
  loading?: 'eager' | 'lazy';
};

/**
 * Collection promo card for the Discovery Set — links through to
 * `/discovery-set`, with price + ATC for the dedicated product variant.
 */
export function CollectionSampleSetCard({
  image,
  selectedVariant,
  loading,
}: CollectionSampleSetCardProps) {
  const {open} = useAside();
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const purchasable = isVariantPurchasable(
    selectedVariant ?? null,
    preordersEnabled,
  );
  const price = selectedVariant?.price;
  const compareAtPrice = selectedVariant?.compareAtPrice;
  const showCompare =
    Boolean(compareAtPrice?.amount) &&
    compareAtPrice!.amount !== price?.amount;

  return (
    <article className="relative mx-auto flex w-full flex-col border border-inkwell-700 bg-vellusum px-4 shadow-[0_2px_3px_rgba(21,32,21,0.35)] sm:px-5">
      {/* 15px inside the border is 16px from the outer edge, in line with the
          collection cards' left-4 rules. */}
      <BlueprintRule
        orientation="v"
        variant="dotted"
        className="pointer-events-none absolute inset-y-0 left-[15px] z-0 text-inkwell-700/18"
      />
      {/* No top padding so the image meets the card's top edge. The rules are
          positioned against this grid, so their insets reach past the card's
          side padding to its edges. */}
      <div className="relative grid grid-cols-[38%_1fr]">
        {/* Out of flow (its grid area is the containing block) so the text
            alone sets the height. Width follows that height to stay square
            until the cap, then it crops taller than wide. */}
        <div className="absolute top-0 left-0 z-2 col-start-1 col-end-2 row-start-1 row-end-2 aspect-square h-full max-w-[calc(100%-0.75rem)] sm:-left-1 sm:row-end-3 sm:max-w-[calc(100%-1.25rem)]">
          <Link
            to="/discovery-set"
            state={STACK_ENTER_STATE}
            prefetch="viewport"
            className="block h-full w-full overflow-hidden bg-inkwell-700/10"
            aria-label={DISCOVERY_SET_TITLE}
          >
            {image ? (
              <Image
                alt={image.altText || DISCOVERY_SET_TITLE}
                className="h-full w-full object-cover object-center"
                data={image}
                loading={loading}
                sizes="(min-width: 640px) 220px, 35vw"
              />
            ) : null}
          </Link>
          <BlueprintRule
            orientation="v"
            variant="dotted"
            className="pointer-events-none absolute inset-y-0 left-full text-inkwell-700/18"
          />
        </div>
        <BlueprintRule
          orientation="h"
          variant="dotted"
          className="pointer-events-none absolute top-full -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
        />

        <div className="z-1 col-start-2 row-start-1 flex min-w-0 flex-col pt-8 sm:pt-8">
          <div>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
            <Link
              to="/discovery-set"
              state={STACK_ENTER_STATE}
              prefetch="viewport"
              className="relative z-1 -mt-0.5 -mb-1 block wrap-break-word font-['wayfinder-cf'] text-[clamp(1.75rem,9vw,3.75rem)] font-light leading-[0.86] tracking-[-6%] text-inkwell-700 no-underline lg:text-[clamp(1.75rem,9vw,4.5rem)]"
            >
              {DISCOVERY_SET_TITLE}
            </Link>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
          </div>

          <span className="mt-3 pb-3 font-['trust-3a'] text-[13px] font-normal leading-snug tracking-[0.02em] text-inkwell-700/85 sm:text-[15px] lg:text-[17px]">
            {DISCOVERY_SET_TAGLINE}
          </span>
          <div>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
          </div>
        </div>

        <div className="z-1 col-start-1 col-end-3 row-start-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 py-3 sm:col-start-2 sm:py-4">
          {price ? (
            <div className="ml-1 min-w-0 font-['config-mono-vf'] tracking-[0.04em] sm:ml-0">
              {showCompare && compareAtPrice ? (
                <s className="block text-[10px] tracking-[0.08em] text-inkwell-700/60 lg:text-[12px]">
                  <span className="sr-only">Original price </span>
                  <Money as="span" data={compareAtPrice} />
                </s>
              ) : null}
              <span className="mt-px block text-[16px] lg:text-[20px]">
                {showCompare ? (
                  <span className="sr-only">Discounted price </span>
                ) : (
                  <span className="sr-only">Price </span>
                )}
                <Money as="span" data={price} />
              </span>
            </div>
          ) : (
            <span aria-hidden />
          )}
          <div className="ml-auto">
            <AddToCartButton
              className={`${PURCHASE_BUTTON_CLASS} ${PURCHASE_BUTTON_TONE_CLASS.inkwell}`}
              disabled={!purchasable || !selectedVariant}
              onClick={() => open('cart')}
              lines={
                selectedVariant
                  ? [
                      {
                        merchandiseId: selectedVariant.id,
                        quantity: 1,
                        selectedVariant,
                      },
                    ]
                  : []
              }
            >
              {purchasable ? 'Add to Cart' : 'Sold out'}
            </AddToCartButton>
          </div>
        </div>
      </div>

      <span className="py-4 text-center font-['trust-3a'] text-[11px] leading-snug tracking-[0.02em] text-inkwell-700/70 lg:py-6.5 lg:text-[13px]">
        {DISCOVERY_SET_FOOTNOTE}
      </span>
    </article>
  );
}
