import {Image} from '@shopify/hydrogen';
import {motion, useReducedMotion} from 'motion/react';
import type {
  ProductFragment,
  ProductVariantFragment,
} from 'storefrontapi.generated';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {
  fadeUpItem,
  staggerContainer,
} from '~/components/home/sections/animations';
import {ProductPrice} from '~/components/product/ProductPrice';
import type {ScentProfile} from '~/lib/scentProfile';
import {ProductBottleBand} from './ProductBottleBand';
import {ProductTitle} from './ProductTitle';

type ProductHeroProps = {
  title: string;
  image: ProductVariantFragment['image'];
  price?: ProductVariantFragment['price'];
  compareAtPrice: ProductVariantFragment['compareAtPrice'];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  scentProfile: ScentProfile;
};

export function ProductHero({
  title,
  image,
  price,
  compareAtPrice,
  selectedVariant,
  scentProfile,
}: ProductHeroProps) {
  const reducedMotion = useReducedMotion();
  const {open} = useAside();

  return (
    <div className="relative flex w-full flex-col overflow-x-hidden bg-vellum-100 text-inkwell-700">
      <motion.div
        className="relative z-1 flex min-h-dvh w-full flex-col"
        variants={staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
      >
        {/* Header + hero share one left logo rule (stops above price/CTA) */}
        <div className="relative shrink-0">
          <div
            aria-hidden
            className="blueprint-rule-v pointer-events-none absolute inset-y-0 left-4 z-20 text-inkwell-700/35 sm:left-8"
          />

          <HeaderBar className="bg-vellum-100" showLeftRule={false} />

          {/* Left edge aligns with logo right blueprint rule; flush to viewport right */}
          <div className="relative flex h-[35dvh] w-full">
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
            <div className="relative min-w-0 flex-1 overflow-hidden">
              {image ? (
                <Image
                  alt={image.altText || title}
                  className="h-full w-full object-cover"
                  data={image}
                  sizes="(min-width: 768px) 85vw, 100vw"
                />
              ) : (
                <div className="h-full w-full bg-inkwell-700/15" />
              )}
            </div>

            <motion.div
              className="pointer-events-none absolute inset-y-0 left-5 z-10 flex items-center justify-start overflow-visible sm:left-9"
              variants={fadeUpItem}
            >
              <ProductTitle
                number={scentProfile.number}
                title={title}
                subtitle={scentProfile.titleSubtitle}
              />
            </motion.div>
          </div>
        </div>

        {/* Price (60%) + CTA (40%) — full-bleed top/bottom rules, no left/right outer rules */}
        <motion.div
          className="relative flex h-[10dvh] w-full shrink-0"
          variants={fadeUpItem}
        >
          <div className="blueprint-rule-h absolute inset-x-0 top-0 text-inkwell-700/35" />
          <div className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35" />

          <div className="relative flex w-[60%] flex-col items-start justify-center gap-[0.3rem] px-8 sm:px-10">
            <div className="blueprint-rule-v absolute inset-y-0 right-0 text-inkwell-700/35" />
            <div className="product-hero-price font-['config-mono-vf'] text-[18px] tracking-[0.04em] text-inkwell-700 sm:text-[22px] [&_.product-price-on-sale_s]:text-inkwell-700/45">
              <ProductPrice price={price} compareAtPrice={compareAtPrice} />
            </div>
            <span className="whitespace-nowrap font-['trust-3a'] text-[11px] leading-none tracking-[0.02em] text-inkwell-700/70">
              {scentProfile.subtitle}
            </span>
          </div>

          <div className="relative flex w-[40%] items-center justify-center">
            <AddToCartButton
              className="cursor-pointer border-0 bg-[#152015] px-4 py-2 font-['config-mono-vf'] text-[12px] font-bold uppercase tracking-[0.08em] text-vellum-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-[13px]"
              disabled={!selectedVariant?.availableForSale}
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
              {selectedVariant?.availableForSale ? 'Purchase' : 'Sold out'}
            </AddToCartButton>
          </div>
        </motion.div>

        <ProductBottleBand
          title={title}
          image={image}
          scentProfile={scentProfile}
        />
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 z-1 flex -translate-x-1/2 flex-col items-center gap-3 text-inkwell-700/40"
        initial={reducedMotion ? false : {opacity: 0, y: -4}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 1.2, duration: 0.6}}
      >
        <span className="pointer-events-none font-['config-mono-vf'] text-[20px] uppercase tracking-[0.14em] sm:text-[22px]">
          SCENT ANATOMY
        </span>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-1 text-inherit transition-opacity hover:opacity-80"
          aria-label="Scroll to scent anatomy"
          onClick={() => {
            document
              .getElementById('scent-anatomy')
              ?.scrollIntoView({behavior: 'smooth', block: 'start'});
          }}
        >
          <svg
            className="h-5 w-5 animate-bounce"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 5v14M19 12l-7 7-7-7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </motion.div>
    </div>
  );
}
