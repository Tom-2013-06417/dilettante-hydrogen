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
 * Title slides in from the left.
 *
 * Waits for `document.fonts.ready` (and Wayfinder if available) before
 * starting — otherwise the first frames use a fallback face, then the
 * Typekit swap causes a one-frame layout hitch at the start of the slide.
 *
 * Avoids Tailwind `opacity-0` on the motion node (it fights Motion’s inline
 * opacity). Animation is armed after mount so hard refresh still plays it.
 */
export function IntroTitleSlide({
  className = '',
  children,
  onAnimationComplete,
  instant = false,
}: IntroTitleSlideProps) {
  const reducedMotion = useReducedMotion();
  const [fontsReady, setFontsReady] = useState(false);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (reducedMotion || instant) {
      onAnimationComplete?.();
      return;
    }

    let cancelled = false;

    async function waitForFonts() {
      try {
        await document.fonts.ready;
        await document.fonts.load('300 60px wayfinder-cf');
      } catch {
        // If the face isn’t registered yet, still proceed after fonts.ready.
      }
      if (!cancelled) setFontsReady(true);
    }

    void waitForFonts();
    return () => {
      cancelled = true;
    };
    // Intentionally omit onAnimationComplete — parent often passes an inline fn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, instant]);

  useEffect(() => {
    if (!fontsReady || instant || reducedMotion) return;
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, [fontsReady, instant, reducedMotion]);

  if (reducedMotion || instant) {
    return <div className={className}>{children}</div>;
  }

  // Keep the title out of visible paint until fonts + motion start.
  if (!fontsReady) {
    return (
      <div className={className} style={{opacity: 0}} aria-hidden>
        {children}
      </div>
    );
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
