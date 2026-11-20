import {DISCOVERY_SET_FOOTNOTE} from '~/lib/sampleSet';

/**
 * Sits in the same first-fold slot as the product page's Scent Anatomy cue —
 * reserved height via `--scent-anatomy-cue-h` on `.product-hero-first-fold`.
 */
export function DiscoverySetFootnote() {
  return (
    <div className="flex h-(--scent-anatomy-cue-h,80px) w-full shrink-0 flex-col items-center justify-center px-6 sm:px-10">
      <p className="whitespace-nowrap text-center font-['trust-3a'] text-[11px] leading-snug tracking-[0.02em] text-inkwell-700/65 lg:text-[13px]">
        {DISCOVERY_SET_FOOTNOTE}
      </p>
    </div>
  );
}
