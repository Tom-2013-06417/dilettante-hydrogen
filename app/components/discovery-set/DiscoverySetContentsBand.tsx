import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {
  HERO_STRIP_IMAGE_SIZES,
  HERO_STRIP_IMAGE_SRCSET,
  ProductHeroPhoto,
  type ProductHeroPhotoImage,
} from '~/components/product/ProductHeroPhoto';
import {DISCOVERY_SET_TITLE} from '~/lib/sampleSet';

export type DiscoverySetContentItem = {
  number: string;
  title: string;
  notes: string[];
};

type DiscoverySetContentsBandProps = {
  image: ProductHeroPhotoImage | null;
  items: DiscoverySetContentItem[];
};

export function DiscoverySetContentsBand({
  image,
  items,
}: DiscoverySetContentsBandProps) {
  return (
    <div
      className="relative grid min-h-0 w-full flex-1 grid-cols-[auto_1fr] text-inkwell-700"
      aria-label={`${DISCOVERY_SET_TITLE} contents`}
    >
      <div className="relative self-stretch overflow-hidden bg-vellum-100">
        {image?.url ? (
          <ProductHeroPhoto
            image={image}
            alt={image.altText || DISCOVERY_SET_TITLE}
            className="absolute inset-0 h-full w-full object-cover"
            sizes={HERO_STRIP_IMAGE_SIZES}
            srcSetOptions={HERO_STRIP_IMAGE_SRCSET}
            fetchPriority="high"
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

      <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
        <BlueprintRule
          orientation="v"
          className="absolute inset-y-0 left-0 z-1 text-inkwell-700/35"
        />

        <div className="flex min-h-0 flex-1 flex-col justify-center py-2 sm:py-3">
          <span className="hidden px-6 font-['config-mono-vf'] text-[11px] font-bold uppercase tracking-[0.14em] text-inkwell-700/70 sm:block sm:px-8 lg:text-[12px]">
            Contents
          </span>

          {/* Full cell width — padding lives on the label/rows, not this rule.
              Hidden with the label on mobile so the list isn’t cramped. */}
          <BlueprintRule
            orientation="h"
            className="relative mt-1.5 hidden text-inkwell-700/35 sm:mt-2 sm:block"
          />

          <ol className="m-0 flex list-none flex-col p-0">
            {items.map((item, index) => (
              <li key={item.number} className="relative mb-0!">
                {index > 0 ? (
                  <BlueprintRule
                    orientation="h"
                    className="absolute inset-x-0 top-0 text-inkwell-700/35"
                  />
                ) : null}
                <div className="flex items-center gap-3 px-6 pt-2 pb-2 sm:gap-4 sm:px-8 sm:pt-2.5 sm:pb-2.5">
                  <span className="shrink-0 font-['config-mono-vf'] text-[12px] font-normal tracking-[0.06em] text-inkwell-700 [font-variant-numeric:slashed-zero] sm:text-[15px] lg:text-[16px]">
                    {item.number}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0">
                    <span className="font-['config-mono-vf'] text-[12px] font-normal uppercase tracking-[0.06em] text-inkwell-700 sm:text-[15px] lg:text-[16px]">
                      {item.title}
                    </span>
                    {item.notes.length ? (
                      <span className="font-['trust-3a'] text-[10px] lowercase leading-[1.3] tracking-[0.08em] text-inkwell-700/65 sm:text-[10px] lg:text-[12px]">
                        {item.notes.join(' · ')}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <BlueprintRule
        orientation="h"
        className="absolute inset-x-0 bottom-0 z-1 text-inkwell-700/35"
      />
    </div>
  );
}
