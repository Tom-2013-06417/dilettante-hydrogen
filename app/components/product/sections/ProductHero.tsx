import {useReducedMotion} from 'motion/react';
import {useState} from 'react';
import {useLocation} from 'react-router';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {IntroFade} from '~/components/product/IntroFade';
import {IntroTitleSlide} from '~/components/product/IntroTitleSlide';
import {
  HERO_BAND_IMAGE_SIZES,
  ProductHeroPhoto,
} from '~/components/product/ProductHeroPhoto';
import {ProductPrice} from '~/components/product/ProductPrice';
import {ScentFormatLine} from '~/components/shared/ScentFormatLine';
import {isStackEnterState} from '~/lib/constants';
import type {ScentProfile} from '~/lib/scentProfile';
import {shopifyCdnUrl, CART_LINE_IMAGE_SIZE} from '~/lib/cartLineImage';
import {ProductBottleBand} from './ProductBottleBand';
import {ProductTitle} from './ProductTitle';

/** Merge product-page scent number onto the variant so optimistic cart lines
 *  match the shape the cart query eventually returns. */
function withCartLineScentNumber<T extends {product?: object | null}>(
  variant: T,
  scentNumber: string,
): T {
  const value = scentNumber.trim();
  if (!value) return variant;
  return {
    ...variant,
    product: {
      ...variant.product,
      scentNumber: {value},
    },
  };
}

type ProductHeroProps = {
  title: string;
  /** Optional parenthetical under the title (Forever only today). */
  titleSubtitle?: string;
  image: ProductVariantFragment['image'];
  price?: ProductVariantFragment['price'];
  compareAtPrice: ProductVariantFragment['compareAtPrice'];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  scentProfile: ScentProfile;
};

export function ProductHero({
  title,
  titleSubtitle,
  image,
  price,
  compareAtPrice,
  selectedVariant,
  scentProfile,
}: ProductHeroProps) {
  const reducedMotion = useReducedMotion();
  const {open} = useAside();
  const {state} = useLocation();
  // Stack push already animates the page in — skip nested hero intros.
  const instantIntro = isStackEnterState(state);
  const [titleNoise, setTitleNoise] = useState(
    Boolean(reducedMotion) || instantIntro,
  );

  return (
    <div className="design-content-shell relative z-1 flex min-h-0 w-full flex-1 flex-col text-inkwell-700">
      {/*
        Desktop only: right edge of the hero image, from under the stack
        HeaderBar down to ProductBottleBand's bottom rule (above SCENT ANATOMY).
      */}
      <BlueprintRule
        orientation="v"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden text-inkwell-700/35 md:block"
      />

      {/* Warm the retina cart thumbnail for Purchase → drawer. Use prefetch
            (not preload): imagesrcset is preload-only, and an unused preload
            triggers Chrome's "preloaded but not used" warning. */}
      {image?.url ? (
        <link
          rel="prefetch"
          as="image"
          href={shopifyCdnUrl(image.url, {
            width: CART_LINE_IMAGE_SIZE * 2,
            height: CART_LINE_IMAGE_SIZE * 2,
            crop: 'center',
          })}
        />
      ) : null}

      {/* Title leads; rest of the page fades in shortly after */}
      <div className="relative shrink-0">
        <IntroFade instant={instantIntro}>
          <BlueprintRule
            orientation="v"
            className="pointer-events-none absolute inset-y-0 left-4 z-20 text-inkwell-700/35 sm:left-8"
          />

          <div className="relative flex h-[30svh] w-full overflow-hidden">
            <div className="w-4 shrink-0 sm:w-8" aria-hidden />
            <div
              className="relative flex shrink-0 items-center px-2 sm:px-4"
              aria-hidden
            >
              <img
                className="invisible h-6 w-auto sm:h-9"
                src={wordmarkInkwell}
                alt=""
              />
            </div>
            <div className="relative min-w-0 flex-1 overflow-hidden bg-vellum-100">
              {image ? (
                <ProductHeroPhoto
                  image={image}
                  alt={image.altText || title}
                  className="h-full w-full object-cover"
                  sizes={HERO_BAND_IMAGE_SIZES}
                  fetchPriority="high"
                />
              ) : (
                <div className="h-full w-full bg-inkwell-700/15" />
              )}
            </div>
          </div>
        </IntroFade>

        {/* Title slides in first (overlaid on hero band) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30svh]">
          <IntroTitleSlide
            instant={instantIntro}
            className="absolute inset-y-0 left-5 flex items-center justify-start overflow-visible sm:left-9"
            onAnimationComplete={() => setTitleNoise(true)}
          >
            <div className="translate-y-[-0.35rem]">
              <ProductTitle
                number={scentProfile.number}
                title={title}
                subtitle={titleSubtitle}
                enableNoise={titleNoise}
              />
            </div>
          </IntroTitleSlide>
        </div>
      </div>

      <IntroFade instant={instantIntro}>
        <div className="relative flex min-h-20 w-full shrink-0">
          {/* Starts at the left V rule (continued from the navbar), not the shell edge. */}
          <BlueprintRule
            orientation="h"
            className="absolute top-0 right-0 left-4 text-inkwell-700/35 sm:left-8"
          />
          <BlueprintRule
            orientation="h"
            className="absolute inset-x-0 bottom-0 text-inkwell-700/35"
          />

          <div className="relative flex w-[60%] flex-col items-start justify-center gap-[0.3rem] px-6 sm:px-10">
            <BlueprintRule
              orientation="v"
              className="absolute inset-y-0 right-0 text-inkwell-700/35"
            />
            <div className="product-hero-price font-['config-mono-vf'] text-[18px] tracking-[0.04em] text-inkwell-700 sm:text-[22px] [&_.product-price-on-sale_s]:text-inkwell-700/45">
              <ProductPrice price={price} compareAtPrice={compareAtPrice} />
            </div>
            <ScentFormatLine
              className="whitespace-nowrap font-['trust-3a'] text-[11px] leading-none tracking-[0.02em] text-inkwell-700/70 lg:text-[13px]"
              concentration={scentProfile.concentration}
              variantTitle={selectedVariant?.title}
            />
          </div>

          <div className="relative flex w-[40%] items-center justify-center">
            <AddToCartButton
              className="cursor-pointer border-0 bg-[#152015] px-5 py-2.5 font-['config-mono-vf'] text-[13px] font-bold uppercase tracking-[0.08em] text-vellum-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-3 sm:text-[14px]"
              disabled={!selectedVariant?.availableForSale}
              onClick={() => open('cart')}
              lines={
                selectedVariant
                  ? [
                      {
                        merchandiseId: selectedVariant.id,
                        quantity: 1,
                        // Optimistic cart uses selectedVariant as the line's
                        // merchandise. Stitch scentNumber from the already-
                        // loaded product page so "No." is present on first
                        // paint and the thumbnail does not resize later.
                        selectedVariant: withCartLineScentNumber(
                          selectedVariant,
                          scentProfile.number,
                        ),
                      },
                    ]
                  : []
              }
            >
              {selectedVariant?.availableForSale ? 'Purchase' : 'Sold out'}
            </AddToCartButton>
          </div>
        </div>
      </IntroFade>

      <IntroFade instant={instantIntro} className="flex min-h-0 flex-1 flex-col">
        <ProductBottleBand
          title={title}
          image={image}
          scentProfile={scentProfile}
        />
      </IntroFade>
    </div>
  );
}
