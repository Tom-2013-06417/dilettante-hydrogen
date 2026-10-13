import {Image, Money, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {useRouteLoaderData} from 'react-router';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {
  PURCHASE_BUTTON_CLASS,
  PURCHASE_BUTTON_TONE_CLASS,
} from '~/components/product/ProductPurchaseButton';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {
  CART_UPSELL_VARIANT_IDS,
  type CartUpsellVariant,
} from '~/lib/cartUpsell';
import {
  isPreorderVariant,
  parsePreorderEta,
  preorderEtaIso,
} from '~/lib/preorder';
import {preordersEnabledFromRootData} from '~/lib/preordersEnabled';
import type {SecondaryImage} from '~/lib/secondaryImageMetafield';
import type {loader as rootLoader} from '~/root';

/**
 * Not a Shopify product: the set is the five 2 mL variants added as separate
 * lines. The cart total only lands on SET_PRICE through the admin's "Buy 4
 * Samples, Get 1 Free" automatic discount.
 */
const SET_PRICE = '1600.0';
const SET_COMPARE_AT_PRICE = '2000.0';

function scentNumberOf(variant: CartUpsellVariant) {
  return variant.product.scentNumber?.value?.trim() ?? '';
}

function sampleSetLines(
  variants: CartUpsellVariant[],
  preordersEnabled: boolean,
): OptimisticCartLineInput[] {
  return [...variants]
    .sort((a, b) => scentNumberOf(a).localeCompare(scentNumberOf(b)))
    .map((variant) => {
      const eta = parsePreorderEta(variant.product.preorderEta ?? null);
      const etaIso =
        eta && isPreorderVariant(variant, preordersEnabled)
          ? preorderEtaIso(eta)
          : null;
      return {
        merchandiseId: variant.id,
        quantity: 1,
        ...(etaIso
          ? {attributes: [{key: '_preorder_eta', value: etaIso}]}
          : {}),
        selectedVariant: variant,
      };
    });
}

type CollectionSampleSetCardProps = {
  /** Collection custom.sample_set_image. */
  image: SecondaryImage | null;
  loading?: 'eager' | 'lazy';
};

export function CollectionSampleSetCard({
  image,
  loading,
}: CollectionSampleSetCardProps) {
  const {open} = useAside();
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const variants = rootData?.cartUpsellVariants ?? [];
  // Oversold 2 mL stock still sells through the set (owners handle
  // fulfillment); only a variant Shopify itself won't sell holds it back.
  const available = variants.length === CART_UPSELL_VARIANT_IDS.length;
  const currencyCode = variants[0]?.price.currencyCode;
  const title = 'Sample Set';

  return (
    <article className="relative mx-auto flex w-full flex-col border border-inkwell-700 bg-vellusum px-4 pb-2 shadow-[0_2px_3px_rgba(21,32,21,0.35)] sm:px-5">
      {/* 15px inside the border is 16px from the outer edge, in line with the
          collection cards' left-4 rules. */}
      <BlueprintRule
        orientation="v"
        variant="dotted"
        className="pointer-events-none absolute inset-y-0 left-[15px] z-0 text-inkwell-700/18"
      />
      {/* No top padding so the image meets the card's top edge. The rules are
          positioned against this grid, so their insets reach past the card's
          side padding to its edges. Mobile drops the price row under the
          image; sm+ keeps it beside it. */}
      <div className="relative grid grid-cols-[38%_1fr]">
        {/* Out of flow (its grid area is the containing block) so the text
            alone sets the height. Width follows that height to stay square
            until the cap, then it crops taller than wide. h-full, not
            top/bottom insets: with an auto height the width cap carries
            through the aspect ratio and cuts the image short. */}
        <div className="absolute top-0 left-0 z-2 col-start-1 col-end-2 row-start-1 row-end-2 aspect-square h-full max-w-[calc(100%-0.75rem)] sm:-left-1 sm:row-end-3 sm:max-w-[calc(100%-1.25rem)]">
          <div className="h-full w-full overflow-hidden bg-inkwell-700/10">
            {image ? (
              <Image
                alt={image.altText || title}
                className="h-full w-full object-cover"
                data={image}
                loading={loading}
                sizes="(min-width: 640px) 220px, 35vw"
              />
            ) : null}
          </div>
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

        <div className="z-1 col-start-2 row-start-1 flex min-w-0 flex-col pt-4 sm:pt-5">
          <div className="my-2 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.02em] lg:text-[16px]">
            No.
            <span className="flex h-3.5 items-center justify-center rounded-[50%] bg-inkwell-700 px-2 font-['config-mono-vf'] text-[11px] font-medium leading-none text-vellum-100 [font-variant-numeric:slashed-zero] lg:h-4.75 lg:px-2.5 lg:text-[16px]">
              01-05
            </span>
          </div>

          <div>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
            <span className="relative z-1 -mt-0.5 -mb-1 block wrap-break-word font-['wayfinder-cf'] text-[clamp(1.75rem,9vw,3.75rem)] font-light leading-[0.86] tracking-[-6%] lg:text-[clamp(1.75rem,9vw,4.5rem)]">
              {title}
            </span>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
          </div>

          <span className="mt-3 pb-3 font-['trust-3a'] text-[13px] font-normal leading-snug tracking-[0.02em] text-inkwell-700/85 sm:text-[15px] lg:text-[17px]">
            Five samples to find your favorites.
          </span>
          <div>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
          </div>
        </div>

        <div className="z-1 col-start-1 col-end-3 row-start-2 flex flex-wrap items-end justify-between gap-x-3 gap-y-2 py-3 sm:col-start-2">
          {currencyCode ? (
            <div className="min-w-0 font-['config-mono-vf'] tracking-[0.04em]">
              <s className="block text-[10px] tracking-[0.08em] text-inkwell-700/60 lg:text-[12px]">
                <span className="sr-only">Original price </span>
                <Money
                  as="span"
                  data={{amount: SET_COMPARE_AT_PRICE, currencyCode}}
                />
              </s>
              <span className="mt-px block text-[16px] lg:text-[20px]">
                <span className="sr-only">Discounted price </span>
                <Money as="span" data={{amount: SET_PRICE, currencyCode}} />
              </span>
            </div>
          ) : (
            <span aria-hidden />
          )}
          <div className="ml-auto">
            <AddToCartButton
              className={`${PURCHASE_BUTTON_CLASS} ${PURCHASE_BUTTON_TONE_CLASS.inkwell}`}
              disabled={!available}
              onClick={() => open('cart')}
              lines={
                available ? sampleSetLines(variants, preordersEnabled) : []
              }
            >
              {available ? 'Add to Cart' : 'Sold out'}
            </AddToCartButton>
          </div>
        </div>
      </div>

      <span className="mt-2 text-center font-['trust-3a'] text-[11px] leading-snug tracking-[0.02em] text-inkwell-700/70 lg:text-[13px]">
        2 mL spray vials. Comes with a 10% discount code for a full bottle (sent
        via email), valid for 45 days.
      </span>
    </article>
  );
}
