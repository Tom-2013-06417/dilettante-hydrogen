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
};

/**
 * Title slides in from the left.
 *
 * Waits for `document.fonts.ready` (and Wayfinder if available) before
 * starting — otherwise the first frames use a fallback face, then the
 * Typekit swap causes a one-frame layout hitch at the start of the slide.
 *
 * Avoids putting Tailwind `opacity-0` on the motion node (it fights Motion’s
 * inline opacity for a frame on startup).
 */
export function IntroTitleSlide({
  className = '',
  children,
  onAnimationComplete,
}: IntroTitleSlideProps) {
  const reducedMotion = useReducedMotion();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    let cancelled = false;

    async function waitForFonts() {
      try {
        await document.fonts.ready;
        // Warm the display face used by ProductTitle (60px / light).
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
  }, [reducedMotion]);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  // Keep the title out of the tree’s visible paint until fonts + motion start.
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
      animate={{opacity: 1, x: 0}}
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
