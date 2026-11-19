import {Image} from '@shopify/hydrogen';
import {Link} from 'react-router';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {STACK_ENTER_STATE} from '~/lib/constants';
import {
  DISCOVERY_SET_FOOTNOTE,
  DISCOVERY_SET_TAGLINE,
  DISCOVERY_SET_TITLE,
} from '~/lib/sampleSet';

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
  loading?: 'eager' | 'lazy';
};

/**
 * Collection promo card for the Discovery Set — same shell as before, but
 * links through to `/discovery-set` with no price / ATC on the card itself.
 */
export function CollectionSampleSetCard({
  image,
  loading,
}: CollectionSampleSetCardProps) {
  return (
    <Link
      to="/discovery-set"
      state={STACK_ENTER_STATE}
      prefetch="viewport"
      className="relative mx-auto flex w-full flex-col border border-inkwell-700 bg-vellusum px-4 shadow-[0_2px_3px_rgba(21,32,21,0.35)] sm:px-5"
    >
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
        <div className="absolute top-0 left-0 z-2 col-start-1 col-end-2 row-start-1 row-end-2 aspect-square h-full max-w-[calc(100%-0.75rem)] sm:-left-1 sm:max-w-[calc(100%-1.25rem)]">
          <div className="h-full w-full overflow-hidden bg-inkwell-700/10">
            {image ? (
              <Image
                alt={image.altText || DISCOVERY_SET_TITLE}
                className="h-full w-full object-cover object-center"
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

        <div className="z-1 col-start-2 row-start-1 flex min-w-0 flex-col pt-8 pb-3 sm:pt-8 sm:pb-4">
          {/*
            Same footprint as CollectionProductCard’s “No.” row so the
            square image (height-driven) matches the other cards.
          */}
          <div
            className="my-2 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.02em] lg:text-[16px]"
            aria-hidden
          >
            <span className="invisible">No.</span>
            <span className="invisible flex h-3.5 w-7 lg:h-4.75 lg:w-9.5" />
          </div>

          <div>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
            <span className="relative z-1 -mt-0.5 -mb-1 block wrap-break-word font-['wayfinder-cf'] text-[clamp(1.75rem,9vw,3.75rem)] font-light leading-[0.86] tracking-[-6%] lg:text-[clamp(1.75rem,9vw,4.5rem)]">
              {DISCOVERY_SET_TITLE}
            </span>
            <BlueprintRule
              orientation="h"
              variant="dotted"
              className="pointer-events-none absolute -right-4 -left-4 z-0 text-inkwell-700/18 sm:-right-5 sm:-left-5"
            />
          </div>

          <span className="mt-3 font-['trust-3a'] text-[13px] font-normal leading-snug tracking-[0.02em] text-inkwell-700/85 sm:text-[15px] lg:text-[17px]">
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
      </div>

      <span className="py-4 text-center font-['trust-3a'] lg:py-6.5 text-[11px] leading-snug tracking-[0.02em] text-inkwell-700/70 lg:text-[13px]">
        {DISCOVERY_SET_FOOTNOTE}
      </span>
    </Link>
  );
}
