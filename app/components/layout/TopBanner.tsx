import {Fragment} from 'react';

/**
 * Site-wide announcement strip. Not sticky — scrolls with the document.
 * Messages (and repeats) share one middle-dot + flex gap for even spacing.
 */

/** Copies of the message set in each half of the marquee track. */
const SET_COPIES = 6;

const DOT = '·';

type TopBannerProps = {
  texts: string[];
};

function MarqueeGroup({
  texts,
  hidden = false,
}: {
  texts: string[];
  hidden?: boolean;
}) {
  const sequence = Array.from({length: SET_COPIES}, () => texts).flat();

  return (
    <div className="top-banner__group" aria-hidden={hidden || undefined}>
      {sequence.map((text, index) => (
        <Fragment key={index}>
          <span className="top-banner__unit shrink-0">{text}</span>
          <span className="top-banner__sep shrink-0" aria-hidden>
            {DOT}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

export function TopBanner({texts}: TopBannerProps) {
  if (!texts.length) return null;

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="top-banner relative z-50 w-full shrink-0 overflow-hidden bg-inkwell-800 text-vellum-100"
    >
      <div className="top-banner__track font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em]">
        <MarqueeGroup texts={texts} />
        <MarqueeGroup texts={texts} hidden />
      </div>
      <p className="sr-only">{texts.join('. ')}</p>
    </div>
  );
}
