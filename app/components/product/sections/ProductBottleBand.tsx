import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import bottleImage from '~/assets/design/bottle_grain.png';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {
  HERO_STRIP_IMAGE_SIZES,
  ProductHeroPhoto,
} from '~/components/product/ProductHeroPhoto';
import type {ScentProfile} from '~/lib/scentProfile';

const BOTTLE_IMAGE = bottleImage;

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
      className="relative grid min-h-0 w-full flex-1 grid-cols-[auto_1fr] grid-rows-[auto_1fr] text-inkwell-700"
      aria-label={`${title} bottle`}
    >
      {/* Key image covers the tagline row and continues through the body. */}
      <div className="relative row-span-2 row-start-1 self-stretch overflow-hidden bg-vellum-100">
        {image ? (
          <ProductHeroPhoto
            image={image}
            alt={image.altText || title}
            className="absolute inset-0 h-full w-full object-cover"
            sizes={HERO_STRIP_IMAGE_SIZES}
            fetchPriority="low"
          />
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

      <div className="relative col-start-2 row-start-1 flex min-h-20 flex-col items-start justify-center gap-2 px-8">
        <BlueprintRule
          orientation="v"
          className="absolute inset-y-0 left-0 z-1 text-inkwell-700/35"
        />
        <span className="text-left font-['trust-3a'] text-[14px] font-medium leading-none tracking-[0.02em] text-inkwell-700 sm:text-[15px] lg:text-[18px]">
          {scentProfile.tagline}
        </span>
        {scentProfile.olfactoryFamily?.length ? (
          <span className="text-left font-['trust-3a'] text-[11px] lowercase leading-none tracking-[0.08em] text-inkwell-700/65 sm:text-[10px] lg:text-[13px]">
            {scentProfile.olfactoryFamily.join(' · ')}
          </span>
        ) : null}
        {/* Starts at the image/text split; bleeds only to the right screen edge. */}
        <BlueprintRule
          orientation="h"
          className="blueprint-rule-h-bleed-right absolute bottom-0 z-1 text-inkwell-700/35"
        />
      </div>

      <div className="relative col-start-2 row-start-2 flex min-h-0 min-w-0 flex-col">
        <BlueprintRule
          orientation="v"
          className="absolute inset-y-0 left-0 z-1 text-inkwell-700/35"
        />

        <div className="flex shrink-0 flex-col gap-3 px-8 py-4">
          <span className="max-w-[36ch] font-['trust-3a'] text-[13px] italic leading-[1.6] tracking-[0.02em] text-inkwell-700/70 lg:text-[16px]">
            {scentProfile.shortDescription}
          </span>
          {scentProfile.heroNotes.length ? (
            <span className="max-w-[36ch] font-['trust-3a'] text-[11px] lowercase leading-[1.4] tracking-[0.08em] text-inkwell-700/65 sm:text-[10px] lg:text-[13px]">
              {scentProfile.heroNotes.join(' · ')}
            </span>
          ) : null}
        </div>

        {/* Absorbs leftover band height so the image column can still stretch */}
        <div className="min-h-0 flex-1" aria-hidden />
      </div>

      {/* Clip only the bottle overhang — keep bleed rules outside this box. */}
      <div className="pointer-events-none absolute inset-0 z-2 overflow-x-clip">
        <div className="absolute bottom-0 left-0 h-[65%] max-h-60 aspect-1000/1236 -translate-x-[8%] translate-y-[12%]">
          <Image
            alt={`${title} bottle`}
            className="h-full w-full object-contain object-bottom-left"
            src={BOTTLE_IMAGE}
            width={1000}
            height={1236}
            sizes="50vw"
          />
        </div>
      </div>

      <BlueprintRule
        orientation="h"
        className="blueprint-rule-h-bleed absolute bottom-0 z-1 text-inkwell-700/35"
      />
    </div>
  );
}
