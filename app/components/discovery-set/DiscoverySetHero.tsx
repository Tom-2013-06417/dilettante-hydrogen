import {Money} from '@shopify/hydrogen';
import {useLocation, useRouteLoaderData} from 'react-router';
import type {DiscoverySetVariantFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {IntroFade} from '~/components/product/IntroFade';
import {
  HERO_BAND_IMAGE_SIZES,
  ProductHeroPhoto,
  type ProductHeroPhotoImage,
} from '~/components/product/ProductHeroPhoto';
import {
  PURCHASE_BUTTON_CLASS,
  PURCHASE_BUTTON_TONE_CLASS,
} from '~/components/product/ProductPurchaseButton';
import {isStackEnterState} from '~/lib/constants';
import {
  isVariantPurchasable,
  preordersEnabledFromRootData,
} from '~/lib/preordersEnabled';
import {
  DISCOVERY_SET_TAGLINE,
  DISCOVERY_SET_TITLE,
  SAMPLE_SET_VOLUME_TITLE,
} from '~/lib/sampleSet';
import {formatVolumeSuffix} from '~/lib/scentVolume';
import type {loader as rootLoader} from '~/root';
import {
  DiscoverySetContentsBand,
  type DiscoverySetContentItem,
} from './DiscoverySetContentsBand';

type DiscoverySetHeroProps = {
  heroImage: ProductHeroPhotoImage | null;
  sideImage: ProductHeroPhotoImage | null;
  items: DiscoverySetContentItem[];
  selectedVariant: DiscoverySetVariantFragment | null;
};

export function DiscoverySetHero({
  heroImage,
  sideImage,
  items,
  selectedVariant,
}: DiscoverySetHeroProps) {
  const {state} = useLocation();
  const {open} = useAside();
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const purchasable = isVariantPurchasable(
    selectedVariant ?? null,
    preordersEnabled,
  );
  const currencyCode = selectedVariant?.price.currencyCode;
  const instantIntro = isStackEnterState(state);
  const volume = formatVolumeSuffix(SAMPLE_SET_VOLUME_TITLE);
  const buttonLabel = purchasable ? 'Add to Cart' : 'Sold out';

  return (
    <div className="design-content-shell relative z-1 flex min-h-0 w-full flex-1 flex-col text-inkwell-700">
      {/* Shell edges — leftmost + rightmost. Logo-aligned V is on image+title. */}
      <BlueprintRule
        orientation="v"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden text-inkwell-700/35 md:block"
      />
      <BlueprintRule
        orientation="v"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden text-inkwell-700/35 md:block"
      />

      {/*
        Image + title share the logo-left V rule (left-4 / sm:left-8 — same
        as HeaderBar / ProductHero). Both sit to the right of that rule.
      */}
      <div className="relative shrink-0">
        <BlueprintRule
          orientation="v"
          className="pointer-events-none absolute inset-y-0 left-4 z-10 text-inkwell-700/35 sm:left-8"
        />

        <IntroFade instant={instantIntro}>
          <div className="discovery-hero-image-band relative ml-4 overflow-hidden bg-vellum-100 sm:ml-8">
            {heroImage ? (
              <ProductHeroPhoto
                image={heroImage}
                alt={heroImage.altText || DISCOVERY_SET_TITLE}
                className="h-full w-full object-cover"
                sizes={HERO_BAND_IMAGE_SIZES}
                fetchPriority="high"
              />
            ) : (
              <div className="h-full w-full bg-inkwell-700/15" />
            )}
          </div>
        </IntroFade>

        {/*
          Vellum title cell — flush to the price row’s top H rule.
          span not h1: app.css’s unlayered h1–h6 font-heading rule beats
          Tailwind’s wayfinder utility (same pattern as ProductTitle).
        */}
        <IntroFade instant={instantIntro}>
          <div className="relative ml-4 bg-vellusum px-6 pt-4 pb-2 sm:ml-8 sm:px-10 sm:pt-5 sm:pb-2.5">
            <span className="relative z-0 -m-0.5 block translate-y-0.5 pr-2 font-['wayfinder-cf'] text-[60px] font-light leading-[0.72] tracking-[-6%] text-inkwell-700 lg:text-[72px]">
              {DISCOVERY_SET_TITLE}
            </span>
            <span className="mt-2 block font-['trust-3a'] text-[14px] font-normal leading-snug tracking-[0.02em] text-inkwell-700 sm:mt-3 sm:text-[15px] lg:text-[18px]">
              {DISCOVERY_SET_TAGLINE}
            </span>
          </div>
        </IntroFade>
      </div>

      <IntroFade instant={instantIntro}>
        <div className="relative flex min-h-20 w-full shrink-0 overflow-visible">
          <BlueprintRule
            orientation="h"
            className="absolute inset-x-0 top-0 text-inkwell-700/35"
          />
          <BlueprintRule
            orientation="h"
            className="absolute bottom-0 left-4 right-[40%] text-inkwell-700/35 sm:left-8"
          />

          <div className="relative flex w-[60%] flex-col items-start justify-center px-6 sm:px-10">
            <BlueprintRule
              orientation="v"
              className="absolute inset-y-0 right-0 text-inkwell-700/35"
            />
            <div className="product-hero-price font-['config-mono-vf'] text-[18px] tracking-[0.04em] text-inkwell-700 sm:text-[22px]">
              {currencyCode && selectedVariant ? (
                <div aria-label="Price" className="product-price" role="group">
                  <Money data={selectedVariant.price} />
                </div>
              ) : (
                <span>&nbsp;</span>
              )}
            </div>
            {volume ? (
              <span className="whitespace-nowrap font-['trust-3a'] text-[11px] leading-none tracking-[0.02em] text-inkwell-700/70 lg:text-[13px]">
                {volume}
              </span>
            ) : null}
          </div>

          <div className="relative flex w-[40%] flex-col items-center justify-center overflow-visible">
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
              {buttonLabel}
            </AddToCartButton>
            <BlueprintRule
              orientation="h"
              className="absolute inset-x-0 bottom-0 text-inkwell-700/35"
            />
          </div>
        </div>
      </IntroFade>

      <IntroFade
        instant={instantIntro}
        className="flex min-h-0 flex-1 flex-col"
      >
        <DiscoverySetContentsBand image={sideImage} items={items} />
      </IntroFade>
    </div>
  );
}
