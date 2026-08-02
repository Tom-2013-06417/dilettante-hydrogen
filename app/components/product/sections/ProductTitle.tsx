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
  "ink-bleed relative z-0 -m-0.5 block pr-2 font-['wayfinder-cf'] font-light tracking-[-6%]";

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

      <div className="relative block w-fit min-w-50 max-w-full overflow-visible bg-vellusum pt-1 pb-3 shadow-[0_2px_3px_rgba(21,32,21,0.35)]">
        {/*
          SVG ink treatment:
          1) Patchy overflow — low-freq turbulence masks a soft dilated fringe
             so only some edges wick (heavy-ink blotches).
          2) Cream mono noise speckles inside the glyph fill.
          Layers under .ink-bleed text-shadow (even edge soften).
        */}
        {enableNoise ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          >
            <filter
              id="product-title-noise"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              filterUnits="objectBoundingBox"
              colorInterpolationFilters="sRGB"
            >
              {/*
                Sparse ink overflows — not a full outline fringe.
                Low-freq noise is hard-thresholded into a few islands; only
                where those islands meet the dilated edge do blotches appear.
                Opacity still varies inside each island.
              */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.08"
                numOctaves="2"
                seed="11"
                stitchTiles="stitch"
                result="inkMap"
              />
              {/* Hard cutoff: sparse islands, but denser than a few dots */}
              <feColorMatrix
                in="inkMap"
                type="matrix"
                values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                2.2 0 0 0 -1.3"
                result="islandsRaw"
              />
              {/* Soften island edges; lift alphas toward solid ink */}
              <feGaussianBlur
                in="islandsRaw"
                stdDeviation="0.55"
                result="islandsSoft"
              />
              <feComponentTransfer in="islandsSoft" result="inkIslands">
                <feFuncA
                  type="gamma"
                  amplitude="1"
                  exponent="0.45"
                  offset="0"
                />
              </feComponentTransfer>
              <feMorphology
                in="SourceAlpha"
                operator="dilate"
                radius="1.2"
                result="dilated"
              />
              <feGaussianBlur
                in="dilated"
                stdDeviation="0.5"
                result="dilatedSoft"
              />
              <feComposite
                in="dilatedSoft"
                in2="SourceAlpha"
                operator="out"
                result="halo"
              />
              {/* Only fringe that intersects an island — gaps stay clean */}
              <feComposite
                in="halo"
                in2="inkIslands"
                operator="in"
                result="sparseHalo"
              />
              <feDisplacementMap
                in="sparseHalo"
                in2="inkMap"
                scale="1.4"
                xChannelSelector="R"
                yChannelSelector="G"
                result="patchyHalo"
              />
              {/* inkwell-700 — matches product title ink */}
              <feFlood
                flood-color="rgb(21 32 21)"
                flood-opacity="1"
                result="inkFill"
              />
              <feComposite
                in="inkFill"
                in2="patchyHalo"
                operator="in"
                result="coloredOverflow"
              />
              <feComponentTransfer in="coloredOverflow" result="faintOverflow">
                <feFuncA type="linear" slope="1.35" />
              </feComponentTransfer>

              {/* Figma mono noise (#FFF6E6) inside glyph fill */}
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
                <feMergeNode in="faintOverflow" />
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
