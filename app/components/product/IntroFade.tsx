import {motion, useReducedMotion} from 'motion/react';
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
 * Animation is armed after mount so a hard refresh still plays it (SSR/hydrate
 * alone often snaps straight to the end state).
 */
export function IntroFade({
  className = '',
  children,
  instant = false,
}: IntroFadeProps) {
  const reducedMotion = useReducedMotion();
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (instant || reducedMotion) return;
    const id = requestAnimationFrame(() => setPlay(true));
    return () => cancelAnimationFrame(id);
  }, [instant, reducedMotion]);

  if (reducedMotion || instant) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{opacity: 0}}
      animate={{opacity: play ? 1 : 0}}
      transition={{
        type: 'tween',
        duration: PRODUCT_FADE_DURATION,
        ease: EASE,
        delay: PRODUCT_FADE_DELAY,
      }}
    >
      {children}
    </motion.div>
  );
}
