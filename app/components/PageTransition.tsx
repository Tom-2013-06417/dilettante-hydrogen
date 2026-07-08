import {AnimatePresence, motion, useReducedMotion} from 'motion/react';
import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {useLocation, useNavigationType} from 'react-router';
import {ClientOnly} from '~/components/ClientOnly';

const EASE = [0.32, 0.72, 0, 1] as const;
const DURATION = 0.38;

const pageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-30%',
    scale: direction > 0 ? 1 : 0.94,
    transformOrigin: direction > 0 ? 'center center' : 'left center',
    zIndex: direction > 0 ? 2 : 1,
    boxShadow:
      direction > 0 ? '-10px 0 30px rgba(0, 0, 0, 0.08)' : 'none',
  }),
  center: {
    x: 0,
    scale: 1,
    transformOrigin: 'center center',
    zIndex: 1,
    boxShadow: 'none',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-30%' : '100%',
    scale: direction > 0 ? 0.94 : 1,
    transformOrigin: direction > 0 ? 'left center' : 'center center',
    zIndex: direction > 0 ? 1 : 2,
    boxShadow:
      direction < 0 ? '-10px 0 30px rgba(0, 0, 0, 0.08)' : 'none',
  }),
};

const reducedMotionVariants = {
  enter: {opacity: 0},
  center: {opacity: 1},
  exit: {opacity: 0},
};

function PageTransitionStatic({children}: {children: ReactNode}) {
  return (
    <div className="page-transition">
      <div className="page-transition-content page-transition-content--static">
        {children}
      </div>
    </div>
  );
}

function PageTransitionAnimated({children}: {children: ReactNode}) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>();

  const direction = navigationType === 'POP' ? -1 : 1;
  const variants = reducedMotion ? reducedMotionVariants : pageVariants;
  const transition = reducedMotion
    ? {duration: 0.12}
    : {duration: DURATION, ease: EASE};

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const updateHeight = () => setHeight(element.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [location.key, children]);

  return (
    <div className="page-transition" style={{height: height ?? 'auto'}}>
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          ref={contentRef}
          key={location.key}
          custom={direction}
          variants={variants}
          initial={false}
          animate="center"
          exit="exit"
          transition={transition}
          className="page-transition-content"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function PageTransition({children}: {children: ReactNode}) {
  return (
    <ClientOnly fallback={<PageTransitionStatic>{children}</PageTransitionStatic>}>
      <PageTransitionAnimated>{children}</PageTransitionAnimated>
    </ClientOnly>
  );
}
