import {CartForm} from '@shopify/hydrogen';
import type {
  CartUserError,
  CartWarning,
} from '@shopify/hydrogen/storefront-api-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useFetcher} from 'react-router';

/**
 * Shared with AddToCartButton so Purchase (LinesAdd) and the cart drawer read
 * the same fetcher. CartMain remounts inside `<Await>` on revalidation; this
 * provider sits above Await so warnings survive that remount.
 */
export const CART_LINES_ADD_FETCHER_KEY = 'cart-lines-add';

/** Shape returned by the `/cart` action for cart mutations. */
export type CartActionData = {
  cart?: {
    lines?: {
      nodes?: Array<{
        id: string;
        quantity: number;
        merchandise?: {id?: string} | null;
      }>;
    };
  } | null;
  errors?: Array<{message: string} | string> | null;
  userErrors?: CartUserError[] | null;
  warnings?: CartWarning[] | null;
};

type CartLineFeedbackValue = {
  getLineError: (lineId: string) => string | undefined;
  setLineErrors: (
    update:
      | Record<string, string>
      | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  clearLineError: (lineId: string) => void;
  /** Baseline merchandise qty while idle — used to detect a clamped LinesAdd. */
  syncQuantities: (
    lines: Array<{merchandiseId?: string; quantity: number}>,
  ) => void;
  /**
   * Absolute quantities the shopper has asked for via +/- before LinesUpdate
   * lands. HeaderBar folds these into the bag badge so the count moves with
   * the stepper during the debounce window (useOptimisticCart alone only
   * updates once the fetcher submits).
   */
  draftQuantities: Record<string, number>;
  setDraftQuantities: (drafts: Record<string, number>) => void;
};

const CartLineFeedbackContext = createContext<CartLineFeedbackValue | null>(
  null,
);

/**
 * Custom qty-stepper copy keyed by Storefront API enums (`CartWarningCode` /
 * `CartErrorCode`). Shopify does not return interpolation variables separately —
 * only `code` + a localized `message` string — so counts come from cart state
 * after the mutation (e.g. the clamped line quantity on not-enough-stock).
 */
export function messageForQuantityIssue(
  code: string | null | undefined,
  lineQty?: number,
): string {
  switch (code) {
    case 'MERCHANDISE_OUT_OF_STOCK':
      return 'Out of stock.';
    case 'MERCHANDISE_NOT_ENOUGH_STOCK':
      return lineQty != null && lineQty > 0
        ? `Only ${lineQty} items left.`
        : 'Not enough in stock.';
    case 'MAXIMUM_EXCEEDED':
      return 'Maximum quantity reached.';
    case 'MINIMUM_NOT_MET':
      return 'Below the minimum quantity.';
    case 'INVALID_INCREMENT':
      return 'Choose a different quantity.';
    default:
      return "Couldn't update quantity.";
  }
}

function qtyByLineId(data: CartActionData) {
  return new Map(
    (data.cart?.lines?.nodes ?? []).map((line) => [line.id, line.quantity]),
  );
}

/**
 * Stock warnings from any cart mutation. Shopify puts the CartLine id on
 * `target` — enough to pin the message under the stepper after Purchase.
 */
export function lineErrorsFromStockWarnings(
  data: CartActionData,
): Record<string, string> {
  const out: Record<string, string> = {};
  const qtyByLine = qtyByLineId(data);

  for (const warning of data.warnings ?? []) {
    if (!warning.target.includes('CartLine')) continue;
    out[warning.target] = messageForQuantityIssue(
      warning.code,
      qtyByLine.get(warning.target),
    );
  }

  return out;
}

/**
 * Fallback when LinesAdd is clamped but warnings are missing or mistargeted:
 * merchandise that did not grow by the requested amount.
 */
function lineErrorsFromClampedAdd(
  data: CartActionData,
  attempted: Array<{merchandiseId?: string; quantity?: number}>,
  qtyBeforeByMerchandise: Map<string, number>,
): Record<string, string> {
  const out: Record<string, string> = {};
  const nodes = data.cart?.lines?.nodes ?? [];

  for (const lineInput of attempted) {
    const merchandiseId = lineInput.merchandiseId;
    if (!merchandiseId) continue;
    const requested = lineInput.quantity ?? 1;
    const before = qtyBeforeByMerchandise.get(merchandiseId) ?? 0;
    const cartLine = nodes.find(
      (line) => line.merchandise?.id === merchandiseId,
    );
    if (!cartLine) continue;
    const after = cartLine.quantity;
    if (after >= before + requested) continue;
    out[cartLine.id] = messageForQuantityIssue(
      after > 0 ? 'MERCHANDISE_NOT_ENOUGH_STOCK' : 'MERCHANDISE_OUT_OF_STOCK',
      after,
    );
  }

  return out;
}

/**
 * Holds line-level stock messages above `<Await resolve={cart}>` so cart
 * revalidation cannot wipe them when CartMain remounts. Also owns the shared
 * LinesAdd fetcher listener used by the product Purchase CTA.
 */
function draftsEqual(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function CartLineFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lineErrors, setLineErrorsState] = useState<Record<string, string>>(
    {},
  );
  const [draftQuantities, setDraftQuantitiesState] = useState<
    Record<string, number>
  >({});
  const addFetcher = useFetcher({key: CART_LINES_ADD_FETCHER_KEY});
  const seenDataRef = useRef(new WeakSet<object>());
  const qtyBeforeRef = useRef<Map<string, number>>(new Map());
  const qtyBaselineRef = useRef<Map<string, number>>(new Map());
  const attemptedRef = useRef<
    Array<{merchandiseId?: string; quantity?: number}>
  >([]);

  const setLineErrors = useCallback(
    (
      update:
        | Record<string, string>
        | ((prev: Record<string, string>) => Record<string, string>),
    ) => {
      setLineErrorsState(update);
    },
    [],
  );

  const clearLineError = useCallback((lineId: string) => {
    setLineErrorsState((prev) => {
      if (!(lineId in prev)) return prev;
      const next = {...prev};
      delete next[lineId];
      return next;
    });
  }, []);

  const setDraftQuantities = useCallback((drafts: Record<string, number>) => {
    setDraftQuantitiesState((prev) =>
      draftsEqual(prev, drafts) ? prev : drafts,
    );
  }, []);

  const syncQuantities = useCallback(
    (lines: Array<{merchandiseId?: string; quantity: number}>) => {
      const map = new Map<string, number>();
      for (const line of lines) {
        if (!line.merchandiseId) continue;
        map.set(line.merchandiseId, line.quantity);
      }
      qtyBaselineRef.current = map;
    },
    [],
  );

  // Snapshot attempted lines + freeze baseline qty while Purchase is submitting.
  useEffect(() => {
    if (addFetcher.state === 'idle' || !addFetcher.formData) return;
    const raw = addFetcher.formData.get(CartForm.INPUT_NAME);
    if (typeof raw !== 'string') return;
    try {
      const parsed = JSON.parse(raw) as {
        action?: string;
        inputs?: {lines?: Array<{merchandiseId?: string; quantity?: number}>};
      };
      if (parsed.action !== CartForm.ACTIONS.LinesAdd) return;
      attemptedRef.current = parsed.inputs?.lines ?? [];
      // Freeze once per submit so optimistic cart bumps cannot overwrite "before".
      if (qtyBeforeRef.current.size === 0) {
        qtyBeforeRef.current = new Map(qtyBaselineRef.current);
      }
    } catch {
      attemptedRef.current = [];
    }
  }, [addFetcher.state, addFetcher.formData]);

  // Apply stock feedback when Purchase (LinesAdd) settles.
  useEffect(() => {
    if (addFetcher.state !== 'idle' || !addFetcher.data) return;
    if (typeof addFetcher.data !== 'object') return;
    if (seenDataRef.current.has(addFetcher.data as object)) return;
    seenDataRef.current.add(addFetcher.data as object);

    const data = addFetcher.data as CartActionData;
    const fromWarnings = lineErrorsFromStockWarnings(data);
    const fromClamp = lineErrorsFromClampedAdd(
      data,
      attemptedRef.current,
      qtyBeforeRef.current,
    );
    attemptedRef.current = [];
    qtyBeforeRef.current = new Map();

    const merged = {...fromClamp, ...fromWarnings};
    if (!Object.keys(merged).length) return;

    setLineErrorsState((prev) => ({...prev, ...merged}));
  }, [addFetcher.state, addFetcher.data]);

  const value = useMemo<CartLineFeedbackValue>(
    () => ({
      getLineError: (lineId: string) => lineErrors[lineId],
      setLineErrors,
      clearLineError,
      syncQuantities,
      draftQuantities,
      setDraftQuantities,
    }),
    [
      clearLineError,
      draftQuantities,
      lineErrors,
      setDraftQuantities,
      setLineErrors,
      syncQuantities,
    ],
  );

  return (
    <CartLineFeedbackContext.Provider value={value}>
      {children}
    </CartLineFeedbackContext.Provider>
  );
}

export function useCartLineFeedback() {
  const context = useContext(CartLineFeedbackContext);
  if (!context) {
    throw new Error(
      'useCartLineFeedback must be used within a CartLineFeedbackProvider',
    );
  }
  return context;
}
