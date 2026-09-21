import {useEffect, useRef, useState, type AnimationEvent} from 'react';
import {useNavigation} from 'react-router';
import {joinClassNames} from '~/lib/pageShell';

/**
 * Site-wide announcement strip (document flow, not sticky).
 * Two text-node halves keep the forever marquee cheap on preview devices.
 *
 * `open` keeps the node mounted through exit — React can't animate a removal.
 */

const SET_COPIES = 2;
const SEP_MOBILE = ' \u2003·\u2003 ';
const SEP_DESKTOP = ' \u2003\u2003\u2003\u2003·\u2003\u2003\u2003\u2003 ';

/** Keep in sync with `.top-banner--exit` / stack Y cover (280ms). */
const EXIT_MS = 280;

type TopBannerProps = {
  open: boolean;
  texts: string[];
};

type Visibility = 'hidden' | 'visible' | 'exiting';

function buildHalf(texts: string[], sep: string): string {
  const unit = texts.join(sep);
  return Array.from({length: SET_COPIES}, () => unit).join(sep) + sep;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function TopBanner({open, texts}: TopBannerProps) {
  const navigation = useNavigation();
  const paused = navigation.state !== 'idle';
  const [desktop, setDesktop] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(
    open ? 'visible' : 'hidden',
  );
  const textsRef = useRef(texts);

  // Keep last non-empty copy for the exit frame (route may clear props).
  if (texts.length) textsRef.current = texts;

  const mounted = visibility !== 'hidden';

  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia('(min-width: 640px)');
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [mounted]);

  useEffect(() => {
    if (open) {
      setVisibility('visible');
      return;
    }
    setVisibility((current) => {
      if (current === 'hidden') return current;
      if (prefersReducedMotion()) return 'hidden';
      return 'exiting';
    });
  }, [open]);

  useEffect(() => {
    if (visibility !== 'exiting') return;
    const fallback = window.setTimeout(() => {
      setVisibility('hidden');
    }, EXIT_MS + 40);
    return () => window.clearTimeout(fallback);
  }, [visibility]);

  const onAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (visibility !== 'exiting') return;
    if (event.target !== event.currentTarget) return;
    if (event.animationName !== 'top-banner-exit') return;
    setVisibility('hidden');
  };

  const displayTexts = texts.length ? texts : textsRef.current;
  if (!mounted || !displayTexts.length) return null;

  const half = buildHalf(displayTexts, desktop ? SEP_DESKTOP : SEP_MOBILE);
  const exiting = visibility === 'exiting';

  return (
    <div
      role="region"
      aria-label="Announcements"
      onAnimationEnd={onAnimationEnd}
      className={joinClassNames(
        'top-banner relative w-full shrink-0 bg-inkwell-800 text-vellum-100',
        exiting && 'top-banner--exit',
        paused && 'top-banner--paused',
      )}
    >
      <div
        className="top-banner__track font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em]"
        aria-hidden
      >
        <span className="top-banner__half">{half}</span>
        <span className="top-banner__half">{half}</span>
      </div>
      <p className="sr-only">{displayTexts.join('. ')}</p>
    </div>
  );
}
