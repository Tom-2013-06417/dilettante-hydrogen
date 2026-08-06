import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {useLocation, useNavigationType} from 'react-router';
import {ClientOnly} from '~/components/shared';
import {storefrontStackDepth} from '~/lib/constants';

const EASE = [0.32, 0.72, 0, 1] as const;
const DURATION = 0.38;
/** Slightly longer so pop feels matched to push (collection is already visible underneath). */
const EXIT_DURATION = 0.5;

/** Default (non-immersive) history push/pop. */
const historyVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-30%',
    scale: direction > 0 ? 1 : 0.94,
    transformOrigin: direction > 0 ? 'center center' : 'left center',
    zIndex: direction > 0 ? 2 : 1,
  }),
  center: {
    x: 0,
    scale: 1,
    transformOrigin: 'center center',
    zIndex: 2,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '100%',
    scale: direction > 0 ? 0.94 : 1,
    transformOrigin: direction > 0 ? 'left center' : 'center center',
    zIndex: direction > 0 ? 1 : 2,
  }),
};

/**
 * Collection ↔ product: cover transition only.
 * Push — product slides in over a still collection (no dual-moving images).
 * Pop — product slides out on top; collection stays underneath (must keep
 * lower z-index or it covers the exit and the animation “disappears”).
 */
const stackVariants = {
  enter: (direction: number) =>
    direction > 0
      ? {x: '100%', zIndex: 2}
      : {x: 0, zIndex: 1},
  center: (direction: number) => ({
    x: 0,
    zIndex: direction > 0 ? 2 : 1,
  }),
  exit: (direction: number) =>
    direction > 0
      ? {x: 0, zIndex: 1}
      : {
          x: '100%',
          zIndex: 2,
          transition: {duration: EXIT_DURATION, ease: EASE},
        },
};

const reducedMotionVariants = {
  enter: {opacity: 0},
  center: {opacity: 1},
  exit: {opacity: 0},
};

export type PageTransitionNav = 'history' | 'stack';

type PageTransitionProps = {
  children: ReactNode;
  /**
   * `history` — browser push/pop (default, non-immersive pages).
   * `stack` — collection ↔ product hierarchy (logo-back pops even on PUSH).
   */
  nav?: PageTransitionNav;
};

function PageTransitionStatic({
  children,
  immersive,
}: {
  children: ReactNode;
  immersive?: boolean;
}) {
  return (
    <div
      className={`page-transition${immersive ? ' page-transition--stack' : ''}`}
    >
      <div
        className={`page-transition-content page-transition-content--static${
          immersive ? ' page-transition-content--stack' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function resolveDirection(
  fromPathname: string,
  toPathname: string,
  navigationType: ReturnType<typeof useNavigationType>,
  nav: PageTransitionNav,
): number {
  if (nav === 'stack') {
    const from = storefrontStackDepth(fromPathname);
    const to = storefrontStackDepth(toPathname);
    if (from != null && to != null && from !== to) {
      return to > from ? 1 : -1;
    }
  }
  return navigationType === 'POP' ? -1 : 1;
}

function PageTransitionAnimated({
  children,
  nav,
}: {
  children: ReactNode;
  nav: PageTransitionNav;
}) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>();
  const pathMetaRef = useRef({
    pathname: location.pathname,
    direction: 1,
  });

  if (pathMetaRef.current.pathname !== location.pathname) {
    pathMetaRef.current = {
      pathname: location.pathname,
      direction: resolveDirection(
        pathMetaRef.current.pathname,
        location.pathname,
        navigationType,
        nav,
      ),
    };
  }

  const direction = pathMetaRef.current.direction;
  const immersive = nav === 'stack';
  const variants = reducedMotion
    ? reducedMotionVariants
    : immersive
      ? stackVariants
      : historyVariants;
  const transition = reducedMotion
    ? {duration: 0.12}
    : {duration: DURATION, ease: EASE};
  // AnimatePresence initial={false} skips enter on first mount; later navigations animate in.
  const initial = immersive ? ('enter' as const) : false;
  // Stack: key on pathname so cart open/close history (same URL, new location.key)
  // cannot remount the product page and replay the entrance animation.
  const presenceKey = immersive ? location.pathname : location.key;

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => {
      const next = element.offsetHeight;
      // Don't shrink while the previous screen may still be exiting — that
      // clips the product→collection slide and makes the pop look like a cut.
      setHeight((prev) =>
        prev == null || next >= prev ? next : prev,
      );
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [presenceKey, children]);

  return (
    <div
      className={`page-transition${immersive ? ' page-transition--stack' : ''}`}
      style={{height: height ?? 'auto'}}
    >
      <AnimatePresence
        initial={false}
        custom={direction}
        onExitComplete={() => {
          const h = contentRef.current?.offsetHeight;
          if (h != null) setHeight(h);
        }}
      >
        {/*
          Keep `ref` off the AnimatePresence child — Motion's PopChild reads
          `props.ref` and trips React 18.3's "ref is not a prop" warning.
        */}
        <motion.div
          key={presenceKey}
          custom={direction}
          variants={variants}
          initial={initial}
          animate="center"
          exit="exit"
          transition={transition}
          className={`page-transition-content${
            immersive ? ' page-transition-content--stack' : ''
          }`}
        >
          <div ref={contentRef}>{children}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PageTransition({
  children,
  nav = 'history',
}: PageTransitionProps) {
  return (
    <ClientOnly
      fallback={
        <PageTransitionStatic immersive={nav === 'stack'}>
          {children}
        </PageTransitionStatic>
      }
    >
      <PageTransitionAnimated nav={nav}>{children}</PageTransitionAnimated>
    </ClientOnly>
  );
}
