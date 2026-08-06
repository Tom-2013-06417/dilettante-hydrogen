import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import {useLocation, useNavigationType} from 'react-router';
import {ClientOnly} from '~/components/shared';
import {storefrontStackDepth} from '~/lib/constants';

/** History (non-stack) transitions. */
const HISTORY_EASE = [0.32, 0.72, 0, 1] as const;
const HISTORY_DURATION = 0.38;

/**
 * Stack cover — matched to the cart aside (`200ms ease-in-out` in app.css),
 * with a slightly longer duration so a full-page slide doesn’t feel clipped.
 * Enter/exit must both tween a real delta — if exit is `x: 0 → 0`, Motion
 * finishes in 0ms and unmounts the previous page mid-slide.
 */
const STACK_DURATION = 0.28;

const stackTween = {
  type: 'tween' as const,
  duration: STACK_DURATION,
  ease: 'easeInOut' as const,
};

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
 * Collection ↔ product cover.
 * Push — product slides in; collection recesses (frozen DOM underneath).
 * Pop — product slides out; collection eases back from recess.
 */
const stackVariants = {
  enter: (direction: number) =>
    direction > 0
      ? {x: '100%', zIndex: 2, transition: stackTween}
      : {x: '-18%', zIndex: 1, transition: stackTween},
  center: (direction: number) => ({
    x: 0,
    zIndex: direction > 0 ? 2 : 1,
    transition: stackTween,
  }),
  exit: (direction: number) =>
    direction > 0
      ? {x: '-18%', zIndex: 1, transition: stackTween}
      : {x: '100%', zIndex: 2, transition: stackTween},
};

const reducedMotionVariants = {
  enter: {opacity: 0},
  center: {opacity: 1},
  exit: {opacity: 0},
};

export type PageTransitionNav = 'history' | 'stack';

type PageTransitionProps = {
  children: ReactNode;
  nav?: PageTransitionNav;
};

type FrozenExit = {
  key: string;
  html: string;
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

/**
 * Stack layers cannot keep a live `<Outlet />` on the exiting page — Outlet
 * (and route hooks) always follow the current URL, so the underneath layer
 * morphs into the oncoming page. Capture the previous DOM as HTML while the
 * old paint is still in the ref, then animate that inert snapshot out.
 */
function StackPresence({
  children,
  direction,
  playEnter,
  transition,
  variants,
  contentRef,
  onSettled,
}: {
  children: ReactNode;
  direction: number;
  playEnter: boolean;
  transition: object;
  variants: typeof stackVariants | typeof reducedMotionVariants;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  onSettled: () => void;
}) {
  const {pathname} = useLocation();
  const liveRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef(pathname);
  const exitRef = useRef<FrozenExit | null>(null);
  const [exitTick, setExitTick] = useState(0);

  // Render-phase capture: refs still point at the previous commit's DOM.
  if (pathRef.current !== pathname) {
    const html = liveRef.current?.innerHTML ?? '';
    exitRef.current = html ? {key: pathRef.current, html} : null;
    pathRef.current = pathname;
  }

  const exitLayer = exitRef.current;
  // Touch exitTick so clearing the exit layer re-renders.
  void exitTick;

  const setLiveNode = (node: HTMLDivElement | null) => {
    liveRef.current = node;
    contentRef.current = node;
  };

  const clearExit = () => {
    if (!exitRef.current) return;
    exitRef.current = null;
    setExitTick((tick) => tick + 1);
    onSettled();
  };

  return (
    <>
      {exitLayer ? (
        <motion.div
          key={`exit-${exitLayer.key}`}
          custom={direction}
          variants={variants}
          initial="center"
          animate="exit"
          transition={transition}
          className="page-transition-content page-transition-content--stack"
          aria-hidden
          onAnimationComplete={clearExit}
        >
          <div
            className="page-transition-frozen"
            // Inert snapshot of the previous route — not a live Outlet.
            dangerouslySetInnerHTML={{__html: exitLayer.html}}
          />
        </motion.div>
      ) : null}
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial={playEnter ? 'enter' : false}
        animate="center"
        transition={transition}
        className="page-transition-content page-transition-content--stack"
      >
        <div ref={setLiveNode}>{children}</div>
      </motion.div>
    </>
  );
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
  const animatingRef = useRef(false);
  const pathMetaRef = useRef({
    pathname: location.pathname,
    direction: 1,
    hasNavigated: false,
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
      hasNavigated: true,
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
    : immersive
      ? stackTween
      : {duration: HISTORY_DURATION, ease: HISTORY_EASE};
  const playEnter = immersive && pathMetaRef.current.hasNavigated;
  const presenceKey = immersive ? location.pathname : location.key;

  const settleHeight = () => {
    animatingRef.current = false;
    const h = contentRef.current?.offsetHeight;
    if (h != null) setHeight(h);
  };

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => {
      if (animatingRef.current) return;
      const next = element.offsetHeight;
      setHeight((prev) => (prev == null || next >= prev ? next : prev));
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [presenceKey, immersive]);

  useLayoutEffect(() => {
    if (!immersive || !pathMetaRef.current.hasNavigated || reducedMotion) {
      return;
    }
    animatingRef.current = true;
  }, [location.pathname, immersive, reducedMotion]);

  return (
    <div
      className={`page-transition${immersive ? ' page-transition--stack' : ''}`}
      style={{height: height ?? 'auto'}}
    >
      {immersive ? (
        reducedMotion ? (
          <div className="page-transition-content page-transition-content--stack">
            <div ref={contentRef}>{children}</div>
          </div>
        ) : (
          <StackPresence
            direction={direction}
            playEnter={playEnter}
            transition={transition}
            variants={variants}
            contentRef={contentRef}
            onSettled={settleHeight}
          >
            {children}
          </StackPresence>
        )
      ) : (
        <HistoryPresence
          presenceKey={presenceKey}
          direction={direction}
          transition={transition}
          variants={variants}
          contentRef={contentRef}
          onSettled={settleHeight}
        >
          {children}
        </HistoryPresence>
      )}
    </div>
  );
}

function HistoryPresence({
  children,
  presenceKey,
  direction,
  transition,
  variants,
  contentRef,
  onSettled,
}: {
  children: ReactNode;
  presenceKey: string;
  direction: number;
  transition: object;
  variants: typeof historyVariants | typeof reducedMotionVariants;
  contentRef: RefObject<HTMLDivElement | null>;
  onSettled: () => void;
}) {
  return (
    <AnimatePresence
      initial={false}
      custom={direction}
      onExitComplete={onSettled}
    >
      <motion.div
        key={presenceKey}
        custom={direction}
        variants={variants}
        initial={false}
        animate="center"
        exit="exit"
        transition={transition}
        className="page-transition-content"
      >
        <div ref={contentRef}>{children}</div>
      </motion.div>
    </AnimatePresence>
  );
}

export function PageTransition({
  children,
  nav = 'history',
}: PageTransitionProps) {
  if (nav === 'stack') {
    return (
      <PageTransitionAnimated nav={nav}>{children}</PageTransitionAnimated>
    );
  }

  return (
    <ClientOnly
      fallback={
        <PageTransitionStatic immersive={false}>{children}</PageTransitionStatic>
      }
    >
      <PageTransitionAnimated nav={nav}>{children}</PageTransitionAnimated>
    </ClientOnly>
  );
}
