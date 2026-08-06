import {BlueprintRule} from '~/components/product/BlueprintRule';

type CollectionHeaderProps = {
  title: string;
  /** Formatted launch date, e.g. "AUG . 2026" from custom.launch_date. */
  launchDateLabel?: string;
  /** Short line under the title from custom.tagline. */
  tagline?: string;
};

/** Centered collection masthead between the navbar and product cards. */
export function CollectionHeader({
  title,
  launchDateLabel,
  tagline,
}: CollectionHeaderProps) {
  return (
    <header className="flex flex-col items-center py-7 text-center text-inkwell-700 sm:py-14">
      {launchDateLabel ? (
        <span className="m-0 font-['config-mono-vf'] text-[9px] font-light uppercase tracking-[0.4em] text-inkwell-700/45 lg:text-[11px]">
          {launchDateLabel}
        </span>
      ) : null}
      <span
        className={`relative m-0 inline-block font-['config-mono-vf'] text-[16px] font-medium uppercase leading-tight tracking-[0.06em] sm:text-[1.5rem] lg:text-[1.8rem] ${
          launchDateLabel ? 'mt-1' : ''
        }`}
      >
        {/* Strikethrough-height ornaments: 10% of title width each side, no overlap */}
        <BlueprintRule
          orientation="h"
          className="pointer-events-none absolute top-1/2 right-full mr-3 w-[15%] -translate-y-1/2 text-inkwell-700/35"
        />
        <BlueprintRule
          orientation="h"
          className="pointer-events-none absolute top-1/2 left-full ml-3 w-[15%] -translate-y-1/2 text-inkwell-700/35"
        />
        {title}
      </span>
      {tagline ? (
        <span className="m-0 mt-1 font-['config-mono-vf'] text-[11px] font-light tracking-[0.01em] text-inkwell-700/85 sm:text-[15px] lg:text-[18px]">
          {tagline}
        </span>
      ) : null}
    </header>
  );
}
