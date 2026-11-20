import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useState} from 'react';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {
  HERO_STRIP_IMAGE_SIZES,
  HERO_STRIP_IMAGE_SRCSET,
  ProductHeroPhoto,
  type ProductHeroPhotoImage,
} from '~/components/product/ProductHeroPhoto';
import {ProductNumberBadge} from '~/components/product/sections/ProductTitle';
import {DISCOVERY_SET_TITLE} from '~/lib/sampleSet';

/** Same easing as FAQ; shorter duration for a lighter accordion feel. */
const ACCORDION_EASE = [0.32, 0.72, 0, 1] as const;
const ACCORDION_DURATION = 0.22;

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
  const [openNumber, setOpenNumber] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const accordionTransition = reducedMotion
    ? {duration: 0}
    : {duration: ACCORDION_DURATION, ease: ACCORDION_EASE};

  function toggleRow(number: string) {
    setOpenNumber((current) => (current === number ? null : number));
  }

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

      <div className="relative flex min-h-0 min-w-0 flex-col overflow-visible sm:overflow-hidden">
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

        {/*
          Mobile: top-align so expanding a row only pushes content below
          (justify-center was re-centering the whole list and shifting “Contents” up).
          Desktop stays centered — no accordion there.
        */}
        <div className="flex min-h-0 flex-1 flex-col justify-start pt-4 pb-2 sm:justify-center sm:pt-3 sm:pb-3">
          <span className="px-3 font-['config-mono-vf'] text-[11px] font-bold uppercase tracking-[0.14em] text-inkwell-700/70 sm:px-8 lg:text-[12px]">
            Contents
          </span>

          <BlueprintRule
            orientation="h"
            className="relative mt-1.5 text-inkwell-700/35 sm:mt-2"
          />

          <ol className="m-0 flex list-none flex-col p-0">
            {items.map((item, index) => {
              const open = openNumber === item.number;
              const hasNotes = item.notes.length > 0;
              const notesId = `discovery-notes-${item.number}`;

              return (
                <li key={item.number} className="relative mb-0!">
                  {index > 0 ? (
                    <BlueprintRule
                      orientation="h"
                      className="absolute inset-x-0 top-0 text-inkwell-700/35"
                    />
                  ) : null}

                  {/* Mobile: accordion row (notes collapsed; chevron toggles). */}
                  <div className="sm:hidden">
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 pr-3 pl-3 text-left ${
                        open ? 'pt-2 pb-0.5' : 'py-2'
                      }`}
                      aria-expanded={hasNotes ? open : undefined}
                      aria-controls={hasNotes ? notesId : undefined}
                      disabled={!hasNotes}
                      onClick={() => hasNotes && toggleRow(item.number)}
                    >
                      <ProductNumberBadge
                        number={item.number}
                        showPrefix={false}
                        className="shrink-0 text-inkwell-700"
                      />
                      <DiscoverySetItemTitle
                        title={item.title}
                        className="min-w-0 flex-1 font-['trust-3a'] text-[12px] font-normal tracking-[0.02em] text-inkwell-700"
                      />
                      {hasNotes ? (
                        <motion.span
                          className="flex shrink-0 items-center"
                          animate={{rotate: open ? 180 : 0}}
                          initial={false}
                          transition={accordionTransition}
                        >
                          <ChevronDownIcon
                            className="h-4 w-4 text-inkwell-700/55"
                            aria-hidden
                          />
                        </motion.span>
                      ) : null}
                    </button>
                    <AnimatePresence initial={false}>
                      {hasNotes && open ? (
                        <motion.div
                          key={notesId}
                          id={notesId}
                          className="overflow-hidden"
                          initial={{height: 0}}
                          animate={{height: 'auto'}}
                          exit={{height: 0}}
                          transition={accordionTransition}
                        >
                          <div className="flex items-start gap-2 pr-3 pb-2 pl-3">
                            {/* Match the badge column so notes line up under the title. */}
                            <span className="invisible shrink-0" aria-hidden>
                              <ProductNumberBadge
                                number={item.number}
                                showPrefix={false}
                              />
                            </span>
                            <span className="min-w-0 flex-1 font-['trust-3a'] text-[10px] lowercase leading-[1.2] tracking-[0.08em] text-inkwell-700/65">
                              {item.notes.join(' · ')}
                            </span>
                            <span
                              className="invisible h-4 w-4 shrink-0"
                              aria-hidden
                            />
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  {/* Desktop: notes always visible, no accordion. */}
                  <div className="hidden items-center gap-4 px-8 pt-2.5 pb-2.5 sm:flex">
                    <ProductNumberBadge
                      number={item.number}
                      showPrefix={false}
                      className="shrink-0 text-inkwell-700"
                    />
                    <div className="flex min-w-0 flex-col gap-0">
                      <DiscoverySetItemTitle
                        title={item.title}
                        className="font-['trust-3a'] text-[15px] font-normal tracking-[0.02em] text-inkwell-700 lg:text-[16px]"
                      />
                      {hasNotes ? (
                        <span className="-mt-0.5 font-['trust-3a'] text-[10px] lowercase leading-[1.2] tracking-[0.08em] text-inkwell-700/65 lg:text-[12px]">
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
