import {ShoppingBagIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useLocation} from 'react-router';
import {ClientOnly} from '~/components/shared';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/** Matches the full-bleed cart breakpoint in app.css (`max-width: 45em`). */
const MOBILE_CART_MQ = '(max-width: 45em)';

/** Marker on history.state so we recognize the entry we pushed for the cart. */
const CART_HISTORY_STATE_KEY = 'dilettanteCartAside';

function isMobileCartViewport() {
  return window.matchMedia(MOBILE_CART_MQ).matches;
}

function historyStateWithoutCart() {
  const prev = window.history.state;
  const state =
    prev && typeof prev === 'object' && !Array.isArray(prev) ? {...prev} : {};
  delete state[CART_HISTORY_STATE_KEY];
  return state;
}

/**
 * After leaving the cart entry via back, it sits in the *forward* stack — a
 * forward swipe would briefly restore it. pushState from here drops that
 * forward entry (browser behavior).
 */
function truncateForwardHistory() {
  window.history.pushState(historyStateWithoutCart(), '');
}

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const headingId = `aside-${type}-heading`;
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
      aria-labelledby={headingId}
    >
      <button className="close-outside" onClick={close} />
      <aside className={type === 'cart' ? 'aside-cart' : ''}>
        <header>
          <div className="aside-heading">
            {type === 'cart' ? (
              <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
            ) : null}
            <h3 id={headingId} className="text-base">
              {heading}
            </h3>
          </div>
          <button className="close reset" onClick={close} aria-label="Close">
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="aside-panel">
          <ClientOnly>{children}</ClientOnly>
        </div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');
  const typeRef = useRef(type);
  typeRef.current = type;

  /** True while the open cart owns a history entry we pushed on mobile. */
  const cartHistoryOwnedRef = useRef(false);
  /** Skip the next popstate — we triggered it with history.back() from the UI. */
  const ignorePopRef = useRef(false);
  const location = useLocation();
  const locationKeyRef = useRef(location.key);

  const releaseCartHistory = useCallback((opts?: {back?: boolean}) => {
    if (!cartHistoryOwnedRef.current) return;
    cartHistoryOwnedRef.current = false;
    if (opts?.back) {
      ignorePopRef.current = true;
      window.history.back();
    }
  }, []);

  const open = useCallback(
    (mode: AsideType) => {
      const prev = typeRef.current;

      // Leaving a history-backed cart for another panel: drop the entry.
      if (prev === 'cart' && mode !== 'cart') {
        releaseCartHistory({back: true});
      }

      setType(mode);

      if (
        mode === 'cart' &&
        prev !== 'cart' &&
        isMobileCartViewport() &&
        !cartHistoryOwnedRef.current
      ) {
        window.history.pushState(
          {
            ...historyStateWithoutCart(),
            [CART_HISTORY_STATE_KEY]: true,
          },
          '',
        );
        cartHistoryOwnedRef.current = true;
      }
    },
    [releaseCartHistory],
  );

  const close = useCallback(() => {
    const wasCart = typeRef.current === 'cart';
    setType('closed');
    if (wasCart) {
      // UI dismiss (X / overlay / Escape): pop our entry so back-stack is clean.
      releaseCartHistory({back: true});
    }
  }, [releaseCartHistory]);

  // Edge swipe / browser back: close the cart without calling history.back again.
  // Then drop the abandoned cart entry from the forward stack so a forward swipe
  // cannot resurrect it.
  useEffect(() => {
    const onPopState = () => {
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        truncateForwardHistory();
        return;
      }
      if (typeRef.current === 'cart') {
        const owned = cartHistoryOwnedRef.current;
        cartHistoryOwnedRef.current = false;
        setType('closed');
        if (owned) truncateForwardHistory();
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // In-app navigation while the drawer is open: close it and abandon the
  // history marker (the router already moved — don't history.back()).
  useEffect(() => {
    if (locationKeyRef.current === location.key) return;
    locationKeyRef.current = location.key;
    if (typeRef.current === 'closed') return;
    cartHistoryOwnedRef.current = false;
    setType('closed');
  }, [location.key]);

  const value = useMemo(
    () => ({
      type,
      open,
      close,
    }),
    [type, open, close],
  );

  return (
    <AsideContext.Provider value={value}>{children}</AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
