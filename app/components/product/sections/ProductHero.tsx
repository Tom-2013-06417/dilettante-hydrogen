import {Image} from '@shopify/hydrogen';
import {motion, useReducedMotion} from 'motion/react';
import type {ProductFragment, ProductVariantFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {ScentTitle} from '~/components/home/sections/ScentTitle';
import {fadeUpItem, staggerContainer} from '~/components/home/sections/animations';
import {ProductPrice} from '~/components/product/ProductPrice';
import {PageContainer} from '~/components/shared';
import type {ScentProfile} from '~/lib/scentProfile';

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
    <section className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-inkwell-900">
      <div className="absolute inset-0">
        {image ? (
          <Image
            alt={image.altText || title}
            className="h-full w-full object-cover"
            data={image}
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-inkwell-700" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-inkwell-900/90 via-inkwell-900/35 to-inkwell-900/20"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-inkwell-900/15 mix-blend-multiply"
          aria-hidden
        />
      </div>

      <motion.div
        className="relative z-10 flex h-full w-full flex-col"
        variants={staggerContainer}
        initial={reducedMotion ? false : 'hidden'}
        animate="show"
      >
        <HeaderBar className="bg-vellum-100/95 backdrop-blur-sm" />

        <PageContainer className="flex min-h-0 grow flex-col justify-end pb-10 pt-6 sm:pb-14">
          <motion.div variants={fadeUpItem}>
            <ScentTitle
              number={scentProfile.number}
              title={title}
              style="bordered"
              size="min"
              showEau={false}
              titleClassName="text-vellum-100"
            />
            <p className="mt-2 pl-6 font-['trust-3a'] text-[13px] tracking-[0.02em] text-vellum-100/80 sm:pl-8">
              {scentProfile.subtitle}
            </p>
          </motion.div>

          <motion.div
            className="mt-8 flex items-end justify-between gap-6"
            variants={fadeUpItem}
          >
            <div className="product-hero-price font-['config-mono-vf'] text-[15px] tracking-[0.04em] text-vellum-100 [&_.product-price-on-sale_s]:text-vellum-100/50">
              <ProductPrice price={price} compareAtPrice={compareAtPrice} />
            </div>

            <AddToCartButton
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
              <span className="inline-flex min-h-12 min-w-[9.5rem] items-center justify-center border border-vellum-100/80 bg-vellum-100/10 px-6 font-['trust-3a'] text-[13px] font-[700] tracking-[0.08em] text-vellum-100 backdrop-blur-sm transition-colors hover:bg-vellum-100 hover:text-inkwell-800 disabled:opacity-40">
                {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
              </span>
            </AddToCartButton>
          </motion.div>
        </PageContainer>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-vellum-100/60"
        initial={reducedMotion ? false : {opacity: 0, y: -4}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 1.2, duration: 0.6}}
        aria-hidden
      >
        <svg className="h-5 w-5 animate-bounce" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 5v14M19 12l-7 7-7-7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </section>
  );
}
