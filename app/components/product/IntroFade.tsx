import {useReducedMotion} from 'motion/react';
import {useEffect, useState, type ReactNode} from 'react';
import {
  EASE,
  PRODUCT_FADE_DELAY,
  PRODUCT_FADE_DURATION,
} from '~/components/home/sections/animations';

type IntroFadeProps = {
  className?: string;
  children: ReactNode;
  /** Skip fade — used when a route transition already owns the entrance. */
  instant?: boolean;
};

/**
 * Page fade — starts slightly after the title slide so the title leads.
 *
 * Pre-mount markup is class-only (`opacity-0`) so SSR matches hydrate when
 * `instant` / reduced-motion differ between server and client.
 */
export function IntroFade({
  className = '',
  children,
  instant = false,
}: IntroFadeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || instant || prefersReducedMotion) return;
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, [mounted, instant, prefersReducedMotion]);

  if (!mounted) {
    return <div className={`${className} opacity-0`.trim()}>{children}</div>;
  }

  if (instant || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`${className} ${play ? 'opacity-100' : 'opacity-0'}`.trim()}
      style={{
        transition: `opacity ${PRODUCT_FADE_DURATION}s cubic-bezier(${EASE.join(',')}) ${PRODUCT_FADE_DELAY}s`,
      }}
    >
      {children}
    </div>
  );
}
