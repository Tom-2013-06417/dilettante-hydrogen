import type {Variants} from 'motion/react';

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Container that staggers its children in when switched to the `show` state.
 * Pair with the item variants below on child `motion` elements.
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {staggerChildren: 0.1, delayChildren: 0.15},
  },
};

export const fadeUpItem: Variants = {
  hidden: {opacity: 0, y: 24},
  show: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: EASE},
  },
};

export const fadeInItem: Variants = {
  hidden: {opacity: 0},
  show: {
    opacity: 1,
    transition: {duration: 0.9, ease: EASE},
  },
};

export const revealRightItem: Variants = {
  hidden: {opacity: 0, x: -24},
  show: {
    opacity: 1,
    x: 0,
    transition: {duration: 0.7, ease: EASE},
  },
};

export const wipeItem: Variants = {
  hidden: {opacity: 0, clipPath: 'inset(0 100% 0 0)'},
  show: {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    transition: {duration: 0.85, ease: EASE},
  },
};

/* ─── Product page intro ─────────────────────────────────────────────
 * Title slides in first; page fade starts shortly after (runs in parallel).
 */

/** Global fade for everything except the title. */
export const PRODUCT_FADE_DURATION = 0.9;

/** Slight head start for the title before the rest fades in. */
export const PRODUCT_FADE_DELAY = 0.22;

export const PRODUCT_TITLE_SLIDE_DELAY = 0;

export const PRODUCT_TITLE_SLIDE_DURATION = 0.7;
