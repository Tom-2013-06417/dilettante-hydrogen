import type {Variants} from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;

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

/**
 * Wipe an image/panel in from the side. Uses clipPath so the container size
 * stays stable during the reveal.
 */
export const wipeItem: Variants = {
  hidden: {opacity: 0, clipPath: 'inset(0 100% 0 0)'},
  show: {
    opacity: 1,
    clipPath: 'inset(0 0% 0 0)',
    transition: {duration: 0.85, ease: EASE},
  },
};
