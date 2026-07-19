import {ScentFormatLine} from '~/components/shared/ScentFormatLine';

export function ScentTitle({
  number,
  title,
  style = 'fade',
  showEau = true,
  size = 'full',
  className = '',
  titleClassName = '',
  concentration = 'Eau de Toilette',
  variantTitle = '30 mL',
}: {
  number: string;
  title: string;
  style?: 'fade' | 'tight' | 'tight-min' | 'bordered';
  showEau?: boolean;
  size?: 'full' | 'min';
  className?: string;
  titleClassName?: string;
  /** From metafield custom.concentration */
  concentration?: string;
  /** Shopify variant title, e.g. "30 mL" */
  variantTitle?: string;
}) {
  const tight = style === 'tight' || style === 'tight-min';
  const cardBg = tight
    ? 'bg-vellum-100 pt-0 pb-2.5 pr-4'
    : style === 'bordered'
      ? 'bg-vellum-100 py-[0.08em] pr-4'
      : 'bg-linear-to-r from-vellum-100 from-70% to-vellum-100/0 py-[0.08em] pr-10 sm:pr-16';

  return (
    <div className={`relative ${className}`}>
      <div className="blueprint-rule-v absolute left-4 top-0 h-full text-inkwell-700/35 sm:left-8" />
      <div className="inline-flex items-center gap-1.5 pb-1 pl-6.5 pr-6 pt-2 text-[12px] font-bold tracking-[0.02em] sm:pl-8">
        No.
        <span className="flex h-4.25 w-8 items-center justify-center rounded-[50%] bg-inkwell-700 font-['config-mono-vf'] text-[14px] font-bold leading-none text-vellum-100 [font-variant-numeric:slashed-zero]">
          {number}
        </span>
      </div>
      <div
        className={`relative ${
          size === 'min'
            ? 'text-[clamp(2rem,3.75vw,2.75rem)]'
            : 'text-[clamp(4rem,7.5vw,5.5rem)]'
        }`}
      >
        {style === 'fade' && (
          <>
            <div className="blueprint-rule-h absolute inset-x-0 top-0 z-10 text-inkwell-700/35" />
            <div className="blueprint-rule-h absolute inset-x-0 bottom-0 z-10 text-inkwell-700/35" />
          </>
        )}
        <div
          className={`relative inline-block max-w-full pl-6 align-top sm:pl-8 ${cardBg}`}
        >
          {tight && (
            <>
              {style === 'tight' && (
                <div className="blueprint-rule-h absolute inset-x-0 top-[0.1425em] z-10 text-inkwell-700/35" />
              )}
              <div className="blueprint-rule-h absolute inset-x-0 top-[0.845em] z-10 text-inkwell-700/35" />
            </>
          )}
          {style === 'bordered' && (
            <>
              <div className="blueprint-rule-h absolute inset-x-0 top-0 z-10 text-inkwell-700/35" />
              <div className="blueprint-rule-h absolute inset-x-0 bottom-0 z-10 text-inkwell-700/35" />
            </>
          )}
          <h2
            className={`max-w-full font-['wayfinder-cf'] text-[length:inherit] font-light leading-[1.05] tracking-[-6%] ${titleClassName}`.trim()}
          >
            {title}
          </h2>
          {showEau && (
            <ScentFormatLine
              className={`-mt-0.75 pb-1 pt-1 font-['trust-3a'] leading-none tracking-[0.01em] ${
                size === 'min' ? 'text-[13px]' : 'text-[16px]'
              }`}
              concentration={concentration}
              variantTitle={variantTitle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
