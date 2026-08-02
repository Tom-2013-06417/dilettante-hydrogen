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

      <div className="relative block w-fit min-w-50 max-w-full overflow-visible bg-vellusum pt-1 pb-3 shadow-[0_2px_3px_rgba(21,32,21,0.35)]">
        {/*
          SVG ink treatment:
          1) Circular ink dots grown off the glyph edge (not an outline fringe).
          2) Cream mono noise speckles inside the glyph fill.
        */}
        {enableNoise ? (
          <svg
            aria-hidden
            className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          >
            <filter
              id="product-title-noise"
              x="-40%"
              y="-50%"
              width="180%"
              height="200%"
              filterUnits="objectBoundingBox"
              primitiveUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              {/*
                Circular ink dots off the glyph (not an outline fringe).
                Seeds are generated only near the letters, then grown into
                hard round lobes; interior is cut away so they stick out.
              */}
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.16"
                numOctaves="1"
                seed="11"
                stitchTiles="stitch"
                result="dotNoise"
              />
              {/* R → A */}
              <feColorMatrix
                in="dotNoise"
                type="matrix"
                values="
                0 0 0 0 0
                0 0 0 0 0
                0 0 0 0 0
                1 0 0 0 0"
                result="noiseAlpha"
              />
              {/* Soft proximity field around glyphs */}
              <feGaussianBlur
                in="SourceAlpha"
                stdDeviation="2.8"
                result="nearBlur"
              />
              <feComponentTransfer in="nearBlur" result="nearZone">
                <feFuncA type="linear" slope="5" intercept="-0.35" />
              </feComponentTransfer>
              {/* Noise only near letters, then keep the stronger peaks */}
              <feComposite
                in="noiseAlpha"
                in2="nearZone"
                operator="in"
                result="nearNoise"
              />
              <feComponentTransfer in="nearNoise" result="seedsRaw">
                <feFuncA type="discrete" tableValues="0 0 1" />
              </feComponentTransfer>
              <feComponentTransfer in="seedsRaw" result="seeds">
                <feFuncA type="discrete" tableValues="0 1" />
              </feComponentTransfer>
              {/* Grow into round dots via blur, then hard snap to solid ink */}
              <feGaussianBlur
                in="seeds"
                stdDeviation="0.55"
                result="grownDots"
              />
              <feComponentTransfer in="grownDots" result="blobsHard">
                <feFuncA type="linear" slope="5" intercept="-3.2" />
              </feComponentTransfer>
              <feComponentTransfer in="blobsHard" result="roundBlobs">
                <feFuncA type="discrete" tableValues="0 1" />
              </feComponentTransfer>
              {/*
                Cut with an eroded glyph mask so lobes tuck under the
                outline; SourceGraphic paints on top → continuous join.
              */}
              <feMorphology
                in="SourceAlpha"
                operator="erode"
                radius="1.4"
                result="insetCut"
              />
              <feComposite
                in="roundBlobs"
                in2="insetCut"
                operator="out"
                result="edgeBlobs"
              />
              {/* Noisy edge jitter — displace, then re-snap so it stays crisp */}
              <feTurbulence
                type="turbulence"
                baseFrequency="1.1"
                numOctaves="3"
                seed="23"
                stitchTiles="stitch"
                result="edgeJitter"
              />
              <feDisplacementMap
                in="edgeBlobs"
                in2="edgeJitter"
                scale="1.35"
                xChannelSelector="R"
                yChannelSelector="G"
                result="jitteredBlobs"
              />
              <feComponentTransfer in="jitteredBlobs" result="crispJitter">
                <feFuncA type="discrete" tableValues="0 1" />
              </feComponentTransfer>
              {/* Same ink as text-inkwell-700 */}
              <feFlood
                flood-color="rgb(21, 32, 21)"
                flood-opacity="1"
                result="inkFill"
              />
              <feComposite
                in="inkFill"
                in2="crispJitter"
                operator="in"
                result="faintOverflow"
              />

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
