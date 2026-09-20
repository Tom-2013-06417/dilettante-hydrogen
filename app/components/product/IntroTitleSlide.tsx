import {motion, useReducedMotion} from 'motion/react';
import {useEffect, useState, type ReactNode} from 'react';
import {
  EASE,
  PRODUCT_TITLE_SLIDE_DELAY,
  PRODUCT_TITLE_SLIDE_DURATION,
} from '~/components/home/sections/animations';

type IntroTitleSlideProps = {
  className?: string;
  children: ReactNode;
  onAnimationComplete?: () => void;
  /** Skip slide — used when a route transition already owns the entrance. */
  instant?: boolean;
};

/**
 * Title slides in from the left after fonts are ready (avoids a Typekit swap
 * hitch). Pre-mount shell matches SSR when `instant` differs on hydrate.
 */
export function IntroTitleSlide({
  className = '',
  children,
  onAnimationComplete,
  instant = false,
}: IntroTitleSlideProps) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (prefersReducedMotion || instant) {
      onAnimationComplete?.();
      return;
    }

    let cancelled = false;

    async function waitForFonts() {
      try {
        await document.fonts.ready;
        await document.fonts.load('300 60px wayfinder-cf');
      } catch {
        // Proceed even if the face isn’t registered yet.
      }
      if (!cancelled) setFontsReady(true);
    }

    void waitForFonts();
    return () => {
      cancelled = true;
    };
    // Intentionally omit onAnimationComplete — parent often passes an inline fn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, prefersReducedMotion, instant]);

  useEffect(() => {
    if (!fontsReady || instant || prefersReducedMotion) return;
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, [fontsReady, instant, prefersReducedMotion]);

  if (!mounted || (!fontsReady && !instant && !prefersReducedMotion)) {
    return (
      <div className={`${className} opacity-0`.trim()} aria-hidden>
        {children}
      </div>
    );
  }

  if (prefersReducedMotion || instant) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{opacity: 0, x: -36}}
      animate={play ? {opacity: 1, x: 0} : {opacity: 0, x: -36}}
      transition={{
        type: 'tween',
        duration: PRODUCT_TITLE_SLIDE_DURATION,
        ease: EASE,
        delay: PRODUCT_TITLE_SLIDE_DELAY,
      }}
      style={{willChange: 'transform, opacity'}}
      onAnimationComplete={onAnimationComplete}
    >
      {children}
    </motion.div>
  );
}
