type ProductTitleProps = {
  number: string;
  title: string;
  /** Optional title parenthetical (same type treatment, smaller size). */
  subtitle?: string;
  className?: string;
  /**
   * SVG noise filter is paint-heavy while sliding. Keep false during intro,
   * then enable after the enter animation completes.
   */
  enableNoise?: boolean;
};

const titleTypeClassName =
  "relative z-0 -m-0.5 block pr-2 font-['wayfinder-cf'] font-light tracking-[-6%]";

/** Product-page scent title: No. badge + vellum plate with dashed cap/baseline rules. */
export function ProductTitle({
  number,
  title,
  subtitle,
  className = '',
  enableNoise = true,
}: ProductTitleProps) {
  const noiseStyle = enableNoise
    ? {filter: 'url(#product-title-noise)'}
    : undefined;

  return (
    <div className={`relative overflow-visible ${className}`}>
      <div className="mb-1 inline-flex items-center gap-1 text-[12px] font-bold tracking-[0.02em]">
        No.
        <span className="flex h-4.25 w-8 items-center justify-center rounded-[50%] bg-inkwell-700 font-['config-mono-vf'] text-[12px] font-medium leading-none text-vellum-100 [font-variant-numeric:slashed-zero]">
          {number}
        </span>
      </div>

      <div className="relative block w-fit min-w-50 max-w-full overflow-visible bg-vellum-100 pt-1 pb-3 shadow-[0_2px_3px_rgba(21,32,21,0.35)]">
        {/*
          Figma mono noise (#FFF6E6, ~22% density, size ~0.5) via SVG filter.
          feTurbulence → cream speckles composited into the glyph fill.
        */}
        {enableNoise ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          >
            <filter
              id="product-title-noise"
              x="-5%"
              y="-5%"
              width="110%"
              height="110%"
              filterUnits="objectBoundingBox"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
                numOctaves="3"
                stitchTiles="stitch"
                result="noise"
              />
              <feColorMatrix
                in="noise"
                type="matrix"
                values="
                0 0 0 0 1
                0 0 0 0 0.965
                0 0 0 0 0.902
                1.25 0 0 0 -0.78"
                result="creamSpeckle"
              />
              <feComposite
                in="creamSpeckle"
                in2="SourceGraphic"
                operator="in"
                result="speckleInGlyph"
              />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
                <feMergeNode in="speckleInGlyph" />
              </feMerge>
            </filter>
          </svg>
        ) : null}
        <div className="relative overflow-visible">
          <div
            aria-hidden
            className="blueprint-rule-h absolute inset-x-0 top-0 z-10 text-inkwell-700/35"
          />
          <div
            aria-hidden
            className="blueprint-rule-h absolute inset-x-0 bottom-0 z-10 text-inkwell-700/35"
          />
          <span
            className={`${titleTypeClassName} translate-y-0.5 whitespace-nowrap text-[60px] leading-[0.72]`}
            style={noiseStyle}
          >
            {title}
          </span>
        </div>
        {subtitle ? (
          <span
            className={`${titleTypeClassName} mt-3 whitespace-nowrap text-[24px] leading-[0.85]`}
            style={noiseStyle}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
