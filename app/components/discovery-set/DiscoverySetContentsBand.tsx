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

/** Articles / short prepositions / conjunctions — stay lowercase in titles. */
const TITLE_CASE_SMALL_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'so',
  'as',
  'at',
  'by',
  'in',
  'of',
  'on',
  'to',
  'up',
  'via',
  'per',
  'from',
  'into',
  'onto',
  'upon',
  'with',
  'over',
  'under',
  'vs',
]);

/**
 * Title case product titles from Shopify. First word is always capitalized;
 * small words stay lowercase (e.g. “Kids on the Slope”, “Forever (on the Crest
 * of a Wave)”).
 */
function toTitleCase(value: string) {
  let isFirstWord = true;
  return value.trim().replace(/\S+/g, (word) => {
    const match = /^(.*?)([A-Za-zÀ-ÖØ-öø-ÿ])(.*)$/u.exec(word);
    if (!match) {
      isFirstWord = false;
      return word;
    }
    const [, before, first, rest] = match;
    const core = `${first}${rest}`.toLowerCase();
    const capitalize = isFirstWord || !TITLE_CASE_SMALL_WORDS.has(core);
    isFirstWord = false;
    if (!capitalize) return `${before}${core}`;
    return `${before}${first.toUpperCase()}${rest.toLowerCase()}`;
  });
}

function DiscoverySetItemTitle({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  return <span className={className}>{toTitleCase(title)}</span>;
}

export function DiscoverySetContentsBand({
  image,
  items,
}: DiscoverySetContentsBandProps) {
  const stripImage = image
    ? {
        ...image,
        // Width-only CDN resize so CSS object-position can center the crop.
        height: null,
      }
    : null;

  return (
    <div
      className="discovery-contents-band relative grid min-h-0 w-full flex-1 grid-cols-[auto_1fr] text-inkwell-700"
      aria-label={`${DISCOVERY_SET_TITLE} contents`}
    >
      {/* Same wordmark-driven strip width as ProductBottleBand (all breakpoints). */}
      <div className="relative self-stretch overflow-hidden bg-vellum-100">
        {stripImage?.url ? (
          <ProductHeroPhoto
            image={stripImage}
            alt={stripImage.altText || DISCOVERY_SET_TITLE}
            className="absolute inset-0 h-full w-full object-cover object-center"
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
        {/*
          Continues the ATC row’s bottom edge — starts at the secondary
          image’s top-right, not at the navbar logo V (left-4).
        */}
        <BlueprintRule
          orientation="h"
          className="absolute inset-x-0 top-0 z-1 text-inkwell-700/35"
        />

        <div className="flex min-h-0 flex-1 flex-col justify-center pt-4 pb-0 sm:pt-3">
          <span className="px-3 font-['config-mono-vf'] text-[11px] font-bold uppercase tracking-[0.14em] text-inkwell-700/70 sm:px-8 lg:text-[12px]">
            Contents
          </span>

          <BlueprintRule
            orientation="h"
            className="relative mt-1.5 text-inkwell-700/35 sm:mt-2"
          />

          <ol className="m-0 flex list-none flex-col p-0">
            {items.map((item, index) => {
              const hasNotes = item.notes.length > 0;

              return (
                <li key={item.number} className="relative mb-0!">
                  {index > 0 ? (
                    <BlueprintRule
                      orientation="h"
                      className="absolute inset-x-0 top-0 text-inkwell-700/35"
                    />
                  ) : null}

                  <div className="flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-8 sm:py-2.5">
                    <span className="shrink-0 font-['config-mono-vf'] text-[12px] font-normal tracking-[0.06em] text-inkwell-700/70 [font-variant-numeric:slashed-zero] sm:text-[15px] lg:text-[16px]">
                      {item.number}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0">
                      <DiscoverySetItemTitle
                        title={item.title}
                        className="truncate font-['trust-3a'] text-[12px] font-normal tracking-[0.02em] text-inkwell-700 sm:overflow-visible sm:whitespace-normal sm:text-[15px] sm:text-clip lg:text-[16px]"
                      />
                      {hasNotes ? (
                        <span className="-mt-0.5 truncate font-['trust-3a'] text-[10px] lowercase leading-[1.2] tracking-[0.08em] text-inkwell-700/65 sm:overflow-visible sm:whitespace-normal sm:text-clip lg:text-[12px]">
                          {item.notes.join(' · ')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
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
