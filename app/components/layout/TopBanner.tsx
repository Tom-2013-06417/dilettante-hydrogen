/**
 * Site-wide announcement strip. Not sticky — scrolls with the document.
 *
 * Performance: each marquee half is one text node. Dozens of animated spans
 * were delaying taps/navigation on preview devices.
 */

/** Repeats of the message set per half — two halves already seamless-loop. */
const SET_COPIES = 3;

const SEP = ' \u2003·\u2003 ';

type TopBannerProps = {
  texts: string[];
};

function buildHalf(texts: string[]): string {
  const unit = texts.join(SEP);
  // Trailing SEP so the join between repeats (and between halves) matches.
  return Array.from({length: SET_COPIES}, () => unit).join(SEP) + SEP;
}

export function TopBanner({texts}: TopBannerProps) {
  if (!texts.length) return null;

  const half = buildHalf(texts);

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="top-banner relative z-50 w-full shrink-0 overflow-hidden bg-inkwell-800 text-vellum-100"
    >
      <div
        className="top-banner__track font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em]"
        aria-hidden
      >
        <span className="top-banner__half">{half}</span>
        <span className="top-banner__half">{half}</span>
      </div>
      <p className="sr-only">{texts.join('. ')}</p>
    </div>
  );
}
