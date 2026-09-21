import {useEffect, useState} from 'react';
import {useNavigation} from 'react-router';

/**
 * Site-wide announcement strip (document flow, not sticky).
 * Two text-node halves keep the forever marquee cheap on preview devices.
 */

const SET_COPIES = 2;
const SEP_MOBILE = ' \u2003·\u2003 ';
const SEP_DESKTOP = ' \u2003\u2003\u2003\u2003·\u2003\u2003\u2003\u2003 ';

type TopBannerProps = {
  texts: string[];
};

function buildHalf(texts: string[], sep: string): string {
  const unit = texts.join(sep);
  return Array.from({length: SET_COPIES}, () => unit).join(sep) + sep;
}

export function TopBanner({texts}: TopBannerProps) {
  const navigation = useNavigation();
  const paused = navigation.state !== 'idle';
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!texts.length) return null;

  const half = buildHalf(texts, desktop ? SEP_DESKTOP : SEP_MOBILE);

  return (
    <div
      role="region"
      aria-label="Announcements"
      className={`top-banner relative w-full shrink-0 overflow-hidden bg-inkwell-800 text-vellum-100${
        paused ? ' top-banner--paused' : ''
      }`}
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
