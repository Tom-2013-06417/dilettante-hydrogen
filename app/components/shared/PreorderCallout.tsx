import {BlueprintRule} from '~/components/product/BlueprintRule';

const RULE_COLOR = 'text-inkwell-700/35';
const LABEL_COLOR = 'text-inkwell-700/70';

type PreorderCalloutProps = {
  content: string | null | undefined;
  label?: string;
};

/**
 * Pre-order ETA on the CTA/tagline seam — replaces the bottom rule in the CTA
 * column; two segments break around the label (text on vellum paper).
 */
export function PreorderCallout({
  content,
  label = 'Estimated ship date',
}: PreorderCalloutProps) {
  if (!content) return null;

  return (
    <div
      role="region"
      aria-label={label}
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 grid w-full translate-y-1/2 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
    >
      <BlueprintRule
        orientation="h"
        className={`min-h-px w-full ${RULE_COLOR}`}
      />
      <span className={`shrink-0 bg-vellum-paper px-2 font-['trust-3a'] text-[11px] leading-none tracking-[0.04em] whitespace-nowrap sm:text-[12px] lg:text-[13px] ${LABEL_COLOR}`}>
        {content}
      </span>
      <BlueprintRule
        orientation="h"
        className={`min-h-px w-full ${RULE_COLOR}`}
      />
    </div>
  );
}
