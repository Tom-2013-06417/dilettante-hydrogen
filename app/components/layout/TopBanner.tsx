import {Fragment} from 'react';
import {useNavigation} from 'react-router';

/**
 * Site-wide announcement strip. Not sticky — scrolls with the document.
 *
 * Each half is a short flex row (messages + dots). Gap is CSS so mobile/desktop
 * can differ without duplicating copy strings.
 */

/** Repeats of the message set per half — two halves already seamless-loop. */
const SET_COPIES = 3;

const DOT = '·';

type TopBannerProps = {
  texts: string[];
};

function MarqueeHalf({texts}: {texts: string[]}) {
  const sequence = Array.from({length: SET_COPIES}, () => texts).flat();

  return (
    <span className="top-banner__half">
      {sequence.map((text, index) => (
        <Fragment key={index}>
          <span className="top-banner__unit">{text}</span>
          <span className="top-banner__sep" aria-hidden>
            {DOT}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export function TopBanner({texts}: TopBannerProps) {
  const navigation = useNavigation();
  // Free the main thread while a route transition is loading/animating.
  const paused = navigation.state !== 'idle';

  if (!texts.length) return null;

  return (
    <div
      role="region"
      aria-label="Announcements"
      className={`top-banner relative z-50 w-full shrink-0 overflow-hidden bg-inkwell-800 text-vellum-100${
        paused ? ' top-banner--paused' : ''
      }`}
    >
      <div
        className="top-banner__track font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em]"
        aria-hidden
      >
        <MarqueeHalf texts={texts} />
        <MarqueeHalf texts={texts} />
      </div>
      <p className="sr-only">{texts.join('. ')}</p>
    </div>
  );
}
