import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import {createPortal} from 'react-dom';
import {useLocation} from 'react-router';
import {useAside} from '~/components/layout/Aside';
import {
  dismissFirstOrderToast,
  FIRST_ORDER_OFFER_COPY,
  FIRST_ORDER_OFFER_FOOTER_SLOT,
  FIRST_ORDER_OFFER_MOTION_MS,
  FIRST_ORDER_OFFER_TOAST_DELAY_MS,
  firstOrderOfferMotionClass,
  shouldHideFirstOrderToast,
} from '~/lib/firstOrderOffer';
import {PageContainer} from './PageContainer';
import {SubscribeModal} from './SubscribeModal';

function CloseIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
    </svg>
  );
}

function isDockedToFooter(node: HTMLElement) {
  const rect = node.getBoundingClientRect();
  return rect.top < window.innerHeight - rect.height;
}

type StripVariant = 'fixed' | 'footer';

type OfferStripProps = {
  variant: StripVariant;
  onJoin: () => void;
  onDismiss: () => void;
  stripRef?: Ref<HTMLDivElement>;
  inactive?: boolean;
  animateEnter?: boolean;
  animateExit?: boolean;
};

/**
 * In-flow footer shell: animates explicit `height` (px) so the ink bar grows/shrinks
 * with the text. `grid-template-rows` was unreliable on enter in WebKit.
 */
function FooterStripShell({
  animateEnter,
  animateExit,
  inactive,
  stripRef,
  children,
}: {
  animateEnter: boolean;
  animateExit: boolean;
  inactive: boolean;
  stripRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | 'auto'>(
    animateEnter ? 0 : 'auto',
  );
  const [transitionOn, setTransitionOn] = useState(false);

  const setInnerRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof stripRef === 'function') stripRef(node);
      else if (stripRef) stripRef.current = node;
    },
    [stripRef],
  );

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (animateExit) {
      const from = inner.offsetHeight;
      setTransitionOn(false);
      setHeight(from);
      if (reduceMotion) {
        setHeight(0);
        return;
      }
      const id = requestAnimationFrame(() => {
        setTransitionOn(true);
        requestAnimationFrame(() => setHeight(0));
      });
      return () => cancelAnimationFrame(id);
    }

    if (animateEnter) {
      const to = inner.scrollHeight;
      setTransitionOn(false);
      setHeight(0);
      if (reduceMotion) {
        setHeight(to);
        return;
      }
      const id = requestAnimationFrame(() => {
        setTransitionOn(true);
        requestAnimationFrame(() => setHeight(to));
      });
      return () => cancelAnimationFrame(id);
    }

    setTransitionOn(false);
    setHeight('auto');
  }, [animateEnter, animateExit]);

  const motionClass = firstOrderOfferMotionClass({
    enter: animateEnter,
    exit: animateExit,
  });

  return (
    <div
      className="overflow-hidden bg-inkwell-800"
      style={{
        height: height === 'auto' ? 'auto' : `${height}px`,
        transition: transitionOn
          ? `height ${FIRST_ORDER_OFFER_MOTION_MS}ms var(--first-order-offer-motion-ease, cubic-bezier(0.22, 1, 0.36, 1))`
          : 'none',
      }}
      onTransitionEnd={(event) => {
        if (event.propertyName !== 'height') return;
        if (animateExit || typeof height !== 'number' || height === 0) return;
        setTransitionOn(false);
        setHeight('auto');
      }}
    >
      <div
        ref={setInnerRef}
        className={`w-full bg-inkwell-800 text-vellum-100 ${motionClass}`}
        aria-hidden={inactive || undefined}
        {...(inactive ? {inert: ''} : {})}
      >
        {children}
      </div>
    </div>
  );
}

function OfferStrip({
  variant,
  onJoin,
  onDismiss,
  stripRef,
  inactive = false,
  animateEnter = false,
  animateExit = false,
}: OfferStripProps) {
  const floating = variant === 'fixed';
  const motionClass = firstOrderOfferMotionClass({
    enter: animateEnter,
    exit: animateExit,
  });

  const content = (
    <PageContainer>
      <div className="relative flex items-center justify-center py-2">
        <p className="m-0! max-w-[calc(100%-2.5rem)] text-center font-['trust-3a'] text-[13px] leading-snug tracking-[0.02em] text-vellum-100/85 sm:text-[14px]">
          {FIRST_ORDER_OFFER_COPY.toastLine}{' '}
          <button
            type="button"
            onClick={onJoin}
            aria-haspopup="dialog"
            tabIndex={inactive ? -1 : undefined}
            className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-[13px] tracking-[0.02em] text-vellum-100 underline underline-offset-4 transition-opacity hover:opacity-80 sm:text-[14px]"
          >
            {FIRST_ORDER_OFFER_COPY.inviteCta}
          </button>
        </p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          tabIndex={inactive ? -1 : undefined}
          className="absolute right-0 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-vellum-100/55 transition-colors hover:text-vellum-100"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </PageContainer>
  );

  if (!floating) {
    return (
      <FooterStripShell
        animateEnter={animateEnter}
        animateExit={animateExit}
        inactive={inactive}
        stripRef={stripRef}
      >
        {content}
      </FooterStripShell>
    );
  }

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 bg-inkwell-800 pb-[env(safe-area-inset-bottom)] ${motionClass}`}
    >
      <div
        ref={stripRef}
        className="pointer-events-auto w-full border-t border-vellum-100/20 bg-inkwell-800 text-vellum-100 shadow-[0_-8px_32px_rgba(0,0,0,0.28)]"
        aria-hidden={inactive || undefined}
        {...(inactive ? {inert: ''} : {})}
      >
        {content}
      </div>
    </div>
  );
}

/**
 * Delayed bottom offer strip. Floats fixed until the footer-attached copy would
 * overlap it, then the in-flow copy takes over so rubber-band scroll stays seamless.
 *
 * Enter/exit motion runs on whichever copy is the live surface at that moment —
 * floating mid-page, or the footer copy if the user is already scrolled there.
 * Mid-scroll handoff stays instant (no re-animate).
 */
export function FirstOrderOfferToast() {
  const location = useLocation();
  const {type: asideType} = useAside();
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [footerSlot, setFooterSlot] = useState<Element | null>(null);
  const [floatActive, setFloatActive] = useState(true);
  const [inFlowNode, setInFlowNode] = useState<HTMLDivElement | null>(null);
  const [floatEnterAnim, setFloatEnterAnim] = useState(false);
  const [footerEnterAnim, setFooterEnterAnim] = useState(false);
  const [exiting, setExiting] = useState(false);
  /** Enter motion assigned once per visibility session (not on float↔footer handoff). */
  const enterAssignedRef = useRef(false);

  const isHome = location.pathname === '/';
  const asideOpen = asideType !== 'closed';
  const showStrip =
    exiting || (eligible && visible && !asideOpen && !modalOpen);

  useEffect(() => {
    if (shouldHideFirstOrderToast() || isHome) {
      setEligible(false);
      setVisible(false);
      setExiting(false);
      enterAssignedRef.current = false;
      return;
    }

    setEligible(true);
    const timer = window.setTimeout(() => {
      if (!shouldHideFirstOrderToast()) setVisible(true);
    }, FIRST_ORDER_OFFER_TOAST_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isHome, location.pathname]);

  useLayoutEffect(() => {
    setFooterSlot(document.querySelector(`[${FIRST_ORDER_OFFER_FOOTER_SLOT}]`));
  }, [location.pathname, showStrip]);

  useLayoutEffect(() => {
    if (!showStrip) {
      enterAssignedRef.current = false;
      setFloatEnterAnim(false);
      setFooterEnterAnim(false);
      return;
    }
    if (exiting) return;

    if (!footerSlot) {
      setFloatActive(true);
      if (!enterAssignedRef.current) {
        enterAssignedRef.current = true;
        setFloatEnterAnim(true);
        setFooterEnterAnim(false);
      }
      return;
    }

    if (!inFlowNode) return;

    const docked = isDockedToFooter(inFlowNode);
    setFloatActive(!docked);

    if (!enterAssignedRef.current) {
      enterAssignedRef.current = true;
      if (docked) {
        setFloatEnterAnim(false);
        setFooterEnterAnim(true);
      } else {
        setFloatEnterAnim(true);
        setFooterEnterAnim(false);
      }
    }

    const onScrollOrResize = () => {
      setFloatActive(!isDockedToFooter(inFlowNode));
    };

    const io = new IntersectionObserver(onScrollOrResize, {
      threshold: [0, 0.01, 0.1, 1],
      rootMargin: '0px 0px 100% 0px',
    });
    io.observe(inFlowNode);
    window.addEventListener('scroll', onScrollOrResize, {passive: true});
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showStrip, footerSlot, inFlowNode, location.pathname, exiting]);

  useEffect(() => {
    if (!floatEnterAnim) return;
    const timeout = window.setTimeout(
      () => setFloatEnterAnim(false),
      FIRST_ORDER_OFFER_MOTION_MS + 50,
    );
    return () => window.clearTimeout(timeout);
  }, [floatEnterAnim]);

  useEffect(() => {
    if (!footerEnterAnim) return;
    const timeout = window.setTimeout(
      () => setFooterEnterAnim(false),
      FIRST_ORDER_OFFER_MOTION_MS + 50,
    );
    return () => window.clearTimeout(timeout);
  }, [footerEnterAnim]);

  useEffect(() => {
    if (!exiting) return;
    const timeout = window.setTimeout(() => {
      setVisible(false);
      setEligible(false);
      setExiting(false);
      enterAssignedRef.current = false;
    }, FIRST_ORDER_OFFER_MOTION_MS);
    return () => window.clearTimeout(timeout);
  }, [exiting]);

  const dismiss = useCallback(() => {
    if (exiting) return;
    dismissFirstOrderToast();
    setExiting(true);
  }, [exiting]);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setVisible(false);
  }, []);

  const onModalClose = useCallback(() => {
    setModalOpen(false);
    if (shouldHideFirstOrderToast()) {
      setEligible(false);
      return;
    }
    dismissFirstOrderToast();
    setEligible(false);
  }, []);

  if (typeof document === 'undefined') return null;

  const fixedStrip =
    showStrip && floatActive && (!footerSlot || inFlowNode) ? (
      <OfferStrip
        variant="fixed"
        onJoin={openModal}
        onDismiss={dismiss}
        animateEnter={floatEnterAnim && !exiting}
        animateExit={exiting && floatActive}
      />
    ) : null;

  const footerExiting = exiting && !floatActive;

  return (
    <>
      {showStrip && footerSlot
        ? createPortal(
            <div role="status">
              <OfferStrip
                variant="footer"
                stripRef={setInFlowNode}
                onJoin={openModal}
                onDismiss={dismiss}
                inactive={floatActive && !footerExiting}
                animateEnter={footerEnterAnim && !exiting}
                animateExit={footerExiting}
              />
            </div>,
            footerSlot,
          )
        : null}

      {createPortal(
        <>
          {fixedStrip ? <div role="status">{fixedStrip}</div> : null}
          <SubscribeModal open={modalOpen} onClose={onModalClose} />
        </>,
        document.body,
      )}
    </>
  );
}
