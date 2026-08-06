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
import {useLocation, useNavigate, type NavigateFunction} from 'react-router';
import {ClientOnly} from '~/components/shared';
import {
  CART_OPEN_SEARCH_PARAM,
  shouldOpenCartFromSearch,
} from '~/lib/constants';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/** Matches the full-bleed cart breakpoint in app.css (`max-width: 45em`). */
const MOBILE_CART_MQ = '(max-width: 45em)';

/** Marker on location.state so we recognize the entry we pushed for the cart. */
const CART_HISTORY_STATE_KEY = 'dilettanteCartAside';

/**
 * Survives Strict Mode remounts while we replace `?cart=t` out of the URL
 * before opening (so mobile back-stack isn't poisoned by the query).
 */
let pendingCartOpen = false;

function isMobileCartViewport() {
  return window.matchMedia(MOBILE_CART_MQ).matches;
}

function asStateObject(state: unknown): Record<string, unknown> {
  if (state && typeof state === 'object' && !Array.isArray(state)) {
    return {...(state as Record<string, unknown>)};
  }
  return {};
}

function stateWithoutCart(state: unknown) {
  const next = asStateObject(state);
  delete next[CART_HISTORY_STATE_KEY];
  return Object.keys(next).length ? next : null;
}

function locationHasCartState(state: unknown) {
  return asStateObject(state)[CART_HISTORY_STATE_KEY] === true;
}

/**
 * After leaving the cart entry via back, it sits in the *forward* stack — a
 * forward swipe would briefly restore it. A same-URL navigate push drops that
 * forward entry (browser behavior) without raw history.pushState, which would
 * desync React Router's idx/key and remount stack pages.
 */
function truncateForwardHistory(
  navigate: NavigateFunction,
  location: {pathname: string; search: string; hash: string; state: unknown},
) {
  navigate(
    {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    },
    {
      preventScrollReset: true,
      state: stateWithoutCart(location.state),
    },
  );
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
          <button
            className="close reset cursor-pointer"
            onClick={close}
            aria-label="Close"
          >
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
  /** Skip the next POP — we triggered it with navigate(-1) from the UI. */
  const ignorePopRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  locationRef.current = location;
  const pathnameRef = useRef(location.pathname);

  const releaseCartHistory = useCallback(
    (opts?: {back?: boolean}) => {
      if (!cartHistoryOwnedRef.current) return;
      cartHistoryOwnedRef.current = false;
      if (opts?.back) {
        ignorePopRef.current = true;
        navigate(-1);
      }
    },
    [navigate],
  );

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
        const loc = locationRef.current;
        navigate(
          {
            pathname: loc.pathname,
            search: loc.search,
            hash: loc.hash,
          },
          {
            preventScrollReset: true,
            state: {
              ...asStateObject(loc.state),
              [CART_HISTORY_STATE_KEY]: true,
            },
          },
        );
        cartHistoryOwnedRef.current = true;
      }
    },
    [navigate, releaseCartHistory],
  );

  const close = useCallback(() => {
    const wasCart = typeRef.current === 'cart';
    setType('closed');
    if (wasCart) {
      // UI dismiss (X / overlay / Escape): pop our entry so back-stack is clean.
      releaseCartHistory({back: true});
    }
  }, [releaseCartHistory]);

  // Edge swipe / browser back: close the cart without calling navigate(-1) again.
  // Then drop the abandoned cart entry from the forward stack so a forward swipe
  // cannot resurrect it.
  useEffect(() => {
    const onPopState = () => {
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        // Defer so React Router can finish applying the POP location first.
        queueMicrotask(() => {
          truncateForwardHistory(navigate, locationRef.current);
        });
        return;
      }
      if (typeRef.current === 'cart') {
        const owned = cartHistoryOwnedRef.current;
        cartHistoryOwnedRef.current = false;
        setType('closed');
        if (owned) {
          queueMicrotask(() => {
            truncateForwardHistory(navigate, locationRef.current);
          });
        }
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [navigate]);

  // Path changes close the drawer. Search/hash-only updates (e.g. stripping
  // `?cart=t`) must not — that would fight deep-link open.
  useEffect(() => {
    if (pathnameRef.current === location.pathname) return;
    pathnameRef.current = location.pathname;
    if (typeRef.current === 'closed') return;
    cartHistoryOwnedRef.current = false;
    setType('closed');
  }, [location.pathname]);

  // If a POP restored a cart-flagged entry (forward swipe before truncate), reopen.
  useEffect(() => {
    if (!locationHasCartState(location.state)) return;
    if (typeRef.current === 'cart') return;
    if (!isMobileCartViewport()) return;
    cartHistoryOwnedRef.current = true;
    setType('cart');
  }, [location.state, location.key]);

  // GET /cart redirects here with `?cart=t`. Strip the flag first, then open —
  // so mobile history.back() on close doesn't revive the query and re-open.
  useEffect(() => {
    if (shouldOpenCartFromSearch(location.search)) {
      pendingCartOpen = true;
      const params = new URLSearchParams(location.search);
      params.delete(CART_OPEN_SEARCH_PARAM);
      const search = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
          hash: location.hash,
        },
        {replace: true, preventScrollReset: true},
      );
      return;
    }

    if (!pendingCartOpen) return;
    pendingCartOpen = false;
    open('cart');
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    open,
  ]);

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
