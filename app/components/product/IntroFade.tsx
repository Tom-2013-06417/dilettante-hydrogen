import {motion, useReducedMotion} from 'motion/react';
import type {ReactNode} from 'react';
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
 * `opacity-0` covers SSR / pre-hydration so content doesn’t flash early.
 */
export function IntroFade({
  className = '',
  children,
  instant = false,
}: IntroFadeProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || instant) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`opacity-0 ${className}`.trim()}
      initial={{opacity: 0}}
      animate={{opacity: 1}}
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
