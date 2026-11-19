import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {useState} from 'react';
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

/** Forever’s admin title — shrink only the parenthetical on the contents list. */
const FOREVER_TITLE_RE = /^(Forever)(\s*\(.*\))$/i;

function DiscoverySetItemTitle({
  title,
  className,
}: {
  title: string;
  className: string;
}) {
  const match = FOREVER_TITLE_RE.exec(title.trim());
  if (match) {
    return (
      <span className={className}>
        {match[1]}
        <span className="text-[0.72em] tracking-[0.04em]">{match[2]}</span>
      </span>
    );
  }
  return <span className={className}>{title}</span>;
}

export function DiscoverySetContentsBand({
  image,
  items,
}: DiscoverySetContentsBandProps) {
  const [openNumber, setOpenNumber] = useState<string | null>(null);

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
      {/*
        Wordmark-driven strip (same as ProductBottleBand). Mobile is 70%
        width for list room; desktop keeps the full strip.
      */}
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
        <div
          className="relative w-[0.7rem] shrink-0 sm:w-8"
          aria-hidden
        />
        <div
          className="relative flex items-center px-[0.35rem] sm:px-4"
          aria-hidden
        >
          <img
            className="invisible h-[1.05rem] w-auto sm:h-9"
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

        <div className="flex min-h-0 flex-1 flex-col justify-center py-2 sm:py-3">
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
                      <span className="shrink-0 font-['config-mono-vf'] text-[12px] font-normal tracking-[0.06em] text-inkwell-700 [font-variant-numeric:slashed-zero]">
                        {item.number}
                      </span>
                      <DiscoverySetItemTitle
                        title={item.title}
                        className="min-w-0 flex-1 font-['config-mono-vf'] text-[12px] font-normal uppercase tracking-[0.06em] text-inkwell-700"
                      />
                      {hasNotes ? (
                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 text-inkwell-700/55 transition-transform duration-200 ${
                            open ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                    {hasNotes && open ? (
                      <div
                        id={notesId}
                        className="flex items-start gap-2 pr-3 pb-2 pl-3"
                      >
                        {/* Match the number column so notes line up under the title. */}
                        <span
                          className="invisible shrink-0 font-['config-mono-vf'] text-[12px] font-normal tracking-[0.06em] [font-variant-numeric:slashed-zero]"
                          aria-hidden
                        >
                          {item.number}
                        </span>
                        <span className="min-w-0 flex-1 font-['trust-3a'] text-[10px] lowercase leading-[1.2] tracking-[0.08em] text-inkwell-700/65">
                          {item.notes.join(' · ')}
                        </span>
                        {hasNotes ? (
                          <span className="invisible h-4 w-4 shrink-0" aria-hidden />
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {/* Desktop: notes always visible, no accordion. */}
                  <div className="hidden items-center gap-4 px-8 pt-2.5 pb-2.5 sm:flex">
                    <span className="shrink-0 font-['config-mono-vf'] text-[15px] font-normal tracking-[0.06em] text-inkwell-700 [font-variant-numeric:slashed-zero] lg:text-[16px]">
                      {item.number}
                    </span>
                    <div className="flex min-w-0 flex-col gap-0">
                      <DiscoverySetItemTitle
                        title={item.title}
                        className="font-['config-mono-vf'] text-[15px] font-normal uppercase tracking-[0.06em] text-inkwell-700 lg:text-[16px]"
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
