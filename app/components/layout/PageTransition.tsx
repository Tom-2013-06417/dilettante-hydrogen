import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {
  createContext,
  useContext,
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
 * Stack cover — same timing as the cart aside (`200ms ease-in-out` in app.css).
 * Driven with CSS `transition` (not Motion) so the compositor owns the slide.
 */
const STACK_MS = 200;

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
  /** Live DOM clone — cheaper + keeps decoded images vs innerHTML. */
  node: Node;
  direction: number;
};

/**
 * False while a stack *push* cover is sliding in. Product page uses this to
 * skip mounting below-the-fold / WebGL work until the slide finishes.
 */
const StackCoverRevealedContext = createContext(true);

export function useStackCoverRevealed(): boolean {
  return useContext(StackCoverRevealedContext);
}

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
 * Cart-like stack cover:
 * - One layer moves (CSS transform); the other stays still.
 * - Outgoing paint is a cloneNode snapshot (Outlet would follow the new URL).
 * - Push defers “revealed” until transitionend so the product can delay work.
 */
function StackPresence({
  children,
  direction,
  playEnter,
  contentRef,
  onSettled,
  onAnimatingChange,
}: {
  children: ReactNode;
  direction: number;
  playEnter: boolean;
  contentRef: MutableRefObject<HTMLDivElement | null>;
  onSettled: () => void;
  onAnimatingChange?: (animating: boolean) => void;
}) {
  const {pathname} = useLocation();
  const liveRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef(pathname);
  const exitRef = useRef<FrozenExit | null>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [exitTick, setExitTick] = useState(0);

  // Render-phase capture: refs still point at the previous commit's DOM.
  if (pathRef.current !== pathname) {
    const source = liveRef.current;
    const clone = source?.cloneNode(true) ?? null;
    exitRef.current =
      clone != null
        ? {key: pathRef.current, node: clone, direction}
        : null;
    pathRef.current = pathname;
  }

  const exitLayer = exitRef.current;
  void exitTick;

  const isAnimating = exitLayer != null && playEnter;

  // Push + frozen underlayer present → keep product below-fold unmounted.
  const coverRevealed = !(
    exitLayer != null &&
    exitLayer.direction > 0 &&
    playEnter
  );

  useLayoutEffect(() => {
    onAnimatingChange?.(isAnimating);
  }, [isAnimating, onAnimatingChange]);

  const setLiveNode = (node: HTMLDivElement | null) => {
    liveRef.current = node;
    contentRef.current = node;
  };

  const attachFrozen = (el: HTMLDivElement | null) => {
    if (!el || !exitLayer) return;
    if (exitLayer.node.parentNode !== el) {
      el.replaceChildren();
      el.appendChild(exitLayer.node);
    }
  };

  const clearExit = () => {
    if (!exitRef.current) {
      onSettled();
      return;
    }
    exitRef.current = null;
    setExitTick((tick) => tick + 1);
    onSettled();
  };

  // Kick the CSS transition after paint (same double-rAF pattern as class toggles).
  useLayoutEffect(() => {
    if (!exitLayer || !playEnter) return;

    const sliding = slideRef.current;
    if (!sliding) return;

    const isPush = exitLayer.direction > 0;

    if (isPush) {
      sliding.classList.remove('page-transition-layer--in');
    } else {
      sliding.classList.add('page-transition-layer--in');
    }

    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        if (isPush) {
          sliding.classList.add('page-transition-layer--in');
        } else {
          sliding.classList.remove('page-transition-layer--in');
        }
      });
    });

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearExit();
    };

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sliding || event.propertyName !== 'transform') {
        return;
      }
      finish();
    };
    sliding.addEventListener('transitionend', onEnd);
    const fallback = window.setTimeout(finish, STACK_MS + 80);

    return () => {
      cancelAnimationFrame(frame1);
      cancelAnimationFrame(frame2);
      sliding.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on route layer change
  }, [pathname, exitLayer?.key, playEnter]);

  // Push: frozen under (still) + live cover (slides in).
  // Pop: live under (still) + frozen cover (slides out).
  const isPush = (exitLayer?.direction ?? direction) > 0;

  const liveLayerClass = isAnimating
    ? isPush
      ? ' page-transition-layer--cover'
      : ' page-transition-layer--under'
    : ' page-transition-content--stack-settled';

  return (
    <StackCoverRevealedContext.Provider value={coverRevealed}>
      {exitLayer && isPush ? (
        <div
          key={`under-${exitLayer.key}`}
          className="page-transition-content page-transition-content--stack page-transition-layer--under"
          aria-hidden
        >
          <div className="page-transition-frozen" ref={attachFrozen} />
        </div>
      ) : null}

      {exitLayer && !isPush ? (
        <div
          key={`cover-${exitLayer.key}`}
          ref={slideRef}
          className="page-transition-content page-transition-content--stack page-transition-layer--cover page-transition-layer--in"
          aria-hidden
        >
          <div className="page-transition-frozen" ref={attachFrozen} />
        </div>
      ) : null}

      <div
        key={pathname}
        ref={isPush && exitLayer ? slideRef : undefined}
        className={`page-transition-content page-transition-content--stack${liveLayerClass}`}
      >
        <div ref={setLiveNode}>{children}</div>
      </div>
    </StackCoverRevealedContext.Provider>
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
  const playEnter = immersive && pathMetaRef.current.hasNavigated;
  const presenceKey = immersive ? location.pathname : location.key;
  const [stackAnimating, setStackAnimating] = useState(false);

  const settleHeight = () => {
    animatingRef.current = false;
    // Let settled stack pages size from normal flow (sticky needs real height).
    if (immersive) {
      setHeight(undefined);
      return;
    }
    const h = contentRef.current?.offsetHeight;
    if (h != null) setHeight(h);
  };

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => {
      if (animatingRef.current) return;
      if (immersive && !stackAnimating) {
        setHeight(undefined);
        return;
      }
      // Track content both ways once settled. Grow-only left a tall empty shell
      // after FAQ accordion collapses (absolute white page-transition-content
      // filled the gap above the footer).
      setHeight(element.offsetHeight);
    };
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [presenceKey, immersive, stackAnimating]);

  useLayoutEffect(() => {
    if (!pathMetaRef.current.hasNavigated) return;

    if (immersive) {
      if (reducedMotion) return;
      animatingRef.current = true;
      // Freeze a viewport-tall shell so absolute cover layers have room to slide.
      const h = Math.max(
        contentRef.current?.offsetHeight ?? 0,
        typeof window !== 'undefined' ? window.innerHeight : 0,
      );
      if (h > 0) setHeight(h);
      return;
    }

    // History: hold the shell at max(prev, next) until exit finishes so a
    // shorter destination can't collapse under the outgoing absolute layer.
    animatingRef.current = true;
    setHeight((prev) =>
      Math.max(prev ?? 0, contentRef.current?.offsetHeight ?? 0),
    );
  }, [presenceKey, immersive, reducedMotion]);

  return (
    <div
      className={`page-transition${immersive ? ' page-transition--stack' : ''}${
        immersive && stackAnimating ? ' page-transition--stack-animating' : ''
      }`}
      style={{height: height ?? 'auto'}}
    >
      {immersive ? (
        reducedMotion ? (
          <div className="page-transition-content page-transition-content--stack page-transition-content--stack-settled">
            <div ref={contentRef}>{children}</div>
          </div>
        ) : (
          <StackPresence
            direction={direction}
            playEnter={playEnter}
            contentRef={contentRef}
            onSettled={settleHeight}
            onAnimatingChange={setStackAnimating}
          >
            {children}
          </StackPresence>
        )
      ) : (
        <HistoryPresence
          presenceKey={presenceKey}
          direction={direction}
          contentRef={contentRef}
          onSettled={settleHeight}
          reducedMotion={!!reducedMotion}
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
  contentRef,
  onSettled,
  reducedMotion,
}: {
  children: ReactNode;
  presenceKey: string;
  direction: number;
  contentRef: RefObject<HTMLDivElement | null>;
  onSettled: () => void;
  reducedMotion: boolean;
}) {
  const variants = reducedMotion ? reducedMotionVariants : historyVariants;
  const transition = reducedMotion
    ? {duration: 0.12}
    : {duration: HISTORY_DURATION, ease: HISTORY_EASE};

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
