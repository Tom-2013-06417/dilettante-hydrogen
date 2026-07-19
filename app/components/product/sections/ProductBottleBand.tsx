import {Image} from '@shopify/hydrogen';
import type {ProductVariantFragment} from 'storefrontapi.generated';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
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
      className="relative h-[35dvh] w-full shrink-0 overflow-visible bg-vellum-100 text-inkwell-700"
      aria-label={`${title} bottle`}
    >
      {/* Matches hero image left edge: gutter + logo cell */}
      <div className="relative flex h-full w-full">
        {/* Narrow left column — product image under bottle */}
        <div className="relative flex shrink-0 self-stretch overflow-hidden">
          {image ? (
            <Image
              alt={image.altText || title}
              className="absolute inset-0 h-full w-full object-cover"
              data={image}
              sizes="25vw"
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

        {/* Wide right column — vertical rule at hero-image left edge */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div
            aria-hidden
            className="blueprint-rule-v absolute inset-y-0 left-0 z-1 text-inkwell-700/35"
          />

          {/* Tagline row — same height as price/CTA */}
          <div className="relative flex h-[10dvh] shrink-0 flex-col items-center justify-center gap-0.5 px-4 sm:px-6">
            <div
              aria-hidden
              className="blueprint-rule-h absolute inset-x-0 bottom-0 text-inkwell-700/35"
            />
            <span className="text-center font-['trust-3a'] text-[13px] leading-snug tracking-[0.02em] text-inkwell-700 sm:text-[15px]">
              {scentProfile.tagline}
            </span>
            <span className="text-center font-['trust-3a'] text-[9px] lowercase leading-none tracking-[0.08em] text-inkwell-700/65 sm:text-[10px]">
              {scentProfile.heroNotes.join(' · ')}
            </span>
          </div>

          {/* Description — remaining height */}
          <div className="flex min-h-0 flex-1 items-center py-0 pl-16 pr-8">
            <span className="max-w-[36ch] font-['trust-3a'] text-[11px] italic leading-[1.65] tracking-[0.02em] text-inkwell-700/70">
              {scentProfile.shortDescription}
            </span>
          </div>
        </div>
      </div>

      {/* Bottle overlays the narrow left column */}
      <Image
        alt={`${title} bottle`}
        className="pointer-events-none absolute bottom-0 left-0 z-2 h-full w-[50%] translate-x-[-25%] translate-y-[5%] object-contain object-bottom-left"
        src={BOTTLE_IMAGE}
        width={187}
        height={178}
        sizes="50vw"
      />

      <div
        aria-hidden
        className="blueprint-rule-h absolute inset-x-0 bottom-0 z-1 text-inkwell-700/35"
      />
    </div>
  );
}
