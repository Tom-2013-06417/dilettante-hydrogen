import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {ProductHeroImageVeil} from '~/components/product/ProductHeroImageVeil';
import type {ScentProfile} from '~/lib/scentProfile';

/** Content > Files upload on the Dilettante Shopify store */
const BOTTLE_IMAGE =
  'https://cdn.shopify.com/s/files/1/0717/5258/1210/files/bottle_1.png';

type ProductBottleBandProps = {
  title: string;
  image: ProductVariantFragment['image'];
  scentProfile: ScentProfile;
};

export function ProductBottleBand({
  title,
  image,
  scentProfile,
}: ProductBottleBandProps) {
  return (
    <div
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-clip overflow-y-visible bg-vellum-100 text-inkwell-700"
      aria-label={`${title} bottle`}
    >
      <div className="relative flex min-h-0 w-full flex-1">
        <div className="relative flex shrink-0 self-stretch overflow-hidden">
          {image ? (
            <>
              <Image
                alt={image.altText || title}
                className="absolute inset-0 h-full w-full object-cover"
                data={image}
                sizes="25vw"
              />
              <ProductHeroImageVeil />
            </>
          ) : (
            <div className="absolute inset-0 bg-inkwell-700/10" />
          )}
          <div className="relative w-4 shrink-0 sm:w-8" aria-hidden />
          <div className="relative flex items-center px-2 sm:px-4" aria-hidden>
            <img
              className="invisible h-6 w-auto sm:h-9"
              src={wordmarkInkwell}
              alt=""
            />
          </div>
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <BlueprintRule
            orientation="v"
            className="absolute inset-y-0 left-0 z-1 text-inkwell-700/35"
          />

          <div className="relative flex min-h-20 shrink-0 flex-col items-start justify-center gap-0.5 px-8">
            <BlueprintRule
              orientation="h"
              className="absolute inset-x-0 bottom-0 text-inkwell-700/35"
            />
            <span className="text-left font-['trust-3a'] text-[14px] leading-snug tracking-[0.02em] text-inkwell-700 sm:text-[15px]">
              {scentProfile.tagline}
            </span>
            {scentProfile.olfactoryFamily?.length ? (
              <span className="text-left font-['trust-3a'] text-[11px] lowercase leading-none tracking-[0.08em] text-inkwell-700/65 sm:text-[10px]">
                {scentProfile.olfactoryFamily.join(' · ')}
              </span>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-3 px-8 py-4">
            <span className="max-w-[36ch] font-['trust-3a'] text-[13px] italic leading-[1.4] tracking-[0.02em] text-inkwell-700/70">
              {scentProfile.shortDescription}
            </span>
            {scentProfile.heroNotes.length ? (
              <span className="max-w-[36ch] font-['trust-3a'] text-[11px] lowercase leading-snug tracking-[0.08em] text-inkwell-700/65 sm:text-[10px]">
                {scentProfile.heroNotes.join(' · ')}
              </span>
            ) : null}
          </div>

          {/* Absorbs leftover band height so the image column can still stretch */}
          <div className="min-h-0 flex-1" aria-hidden />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 z-2 h-1/2 max-h-44 aspect-187/178 translate-x-[-25%] translate-y-[5%]">
        <Image
          alt={`${title} bottle`}
          className="h-full w-full object-contain object-bottom-left"
          src={BOTTLE_IMAGE}
          width={187}
          height={178}
          sizes="50vw"
        />
      </div>

      <BlueprintRule
        orientation="h"
        className="absolute inset-x-0 bottom-0 z-1 text-inkwell-700/35"
      />
    </div>
  );
}
