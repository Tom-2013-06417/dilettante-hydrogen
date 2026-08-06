import {CartForm} from '@shopify/hydrogen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {useFetcher, useFetchers} from 'react-router';
import type {CartLine} from './CartLineItem';
import type {CartLayout} from './CartMain';
import {
  type CartActionData,
  lineErrorsFromStockWarnings,
  messageForQuantityIssue,
  useCartLineFeedback,
} from './CartLineFeedback';

/** Wait this long after the last +/- click before sending one update. */
const DEBOUNCE_MS = 500;

/**
 * True for a line the Cart API knows about. `useOptimisticCart` stands in a
 * placeholder line while an add is in flight, and the cart action *throws* if a
 * mutation names one (`throwIfLinesAreOptimistic`). Hydrogen has an
 * `isOptimisticLineId` for this but does not export it, so test for the gid form
 * the Cart API requires instead of leaning on its internal prefix.
 */
function isSavedLineId(lineId: string) {
  return lineId.startsWith('gid://');
}

type Draft = {
  quantity: number;
  /** Used to follow a placeholder line onto its saved id once the add lands. */
  merchandiseId?: string;
};

/** lineId -> the quantity the shopper wants, not yet confirmed by the server. */
type Drafts = Record<string, Draft>;

type CartLineUpdatesValue = {
  /** Record a desired quantity and (re)arm the single debounced submit. */
  setQuantity: (line: CartLine, quantity: number) => void;
  /** Drop a draft without submitting it. Used before removing a line. */
  cancelQuantity: (lineId: string) => void;
  /** The draft quantity, or undefined when the line follows server state. */
  getDraftQuantity: (lineId: string) => number | undefined;
  /** Server message for a line after a failed or adjusted quantity update. */
  getLineError: (lineId: string) => string | undefined;
  /** A debounce is pending, or some cart mutation is in flight. */
  isCartBusy: boolean;
};

/**
 * Map a LinesUpdate response onto the line ids that were just submitted.
 * Stock issues arrive as warnings with a CartLine `target`; validation failures
 * as userErrors whose `field` indexes into the submitted `lines` array.
 */
function lineErrorsFromUpdateResponse(
  submittedIds: string[],
  data: CartActionData,
): Record<string, string> {
  const out = lineErrorsFromStockWarnings(data);
  const submitted = new Set(submittedIds);
  const qtyByLine = new Map(
    (data.cart?.lines?.nodes ?? []).map((line) => [line.id, line.quantity]),
  );

  for (const id of Object.keys(out)) {
    if (!submitted.has(id)) delete out[id];
  }

  for (const userError of data.userErrors ?? []) {
    const linesAt = userError.field?.indexOf('lines') ?? -1;
    const index =
      linesAt >= 0 ? Number(userError.field?.[linesAt + 1]) : Number.NaN;
    const lineId = Number.isInteger(index) ? submittedIds[index] : undefined;
    const resolvedId =
      lineId ?? (submittedIds.length === 1 ? submittedIds[0] : undefined);
    if (!resolvedId) continue;
    out[resolvedId] = messageForQuantityIssue(
      userError.code,
      qtyByLine.get(resolvedId),
    );
  }

  if (
    (data.errors?.length ?? 0) > 0 &&
    submittedIds.length === 1 &&
    !out[submittedIds[0]]
  ) {
    out[submittedIds[0]] = messageForQuantityIssue(undefined);
  }

  return out;
}

const CartLineUpdatesContext = createContext<CartLineUpdatesValue | null>(null);

/**
 * Owns quantity drafts, the debounce timer and the update fetcher for a cart.
 *
 * Kept above the line items on purpose: a line item unmounts when its line is
 * removed (and the whole drawer unmounts when it closes), which would drop a
 * pending edit. Holding one timer here also lets several lines edited in the
 * same window batch into a single LinesUpdate.
 *
 * Line error copy lives in CartLineFeedbackProvider (above `<Await>`) so
 * Purchase warnings survive cart revalidation remounts.
 */
export function CartLineUpdatesProvider({
  children,
  layout,
  lines,
  serverLines = [],
}: {
  children: React.ReactNode;
  layout: CartLayout;
  lines: CartLine[];
  /** Non-optimistic qty baseline for Purchase clamp detection. */
  serverLines?: Array<{
    quantity: number;
    merchandise?: {id?: string} | null;
  }>;
}) {
  const {
    getLineError,
    setLineErrors,
    clearLineError,
    syncQuantities,
    setDraftQuantities,
  } = useCartLineFeedback();

  // Key by layout so concurrent cart UIs (if any) don't cancel each other's submits.
  const fetcher = useFetcher({key: `cart-lines-update-${layout}`});
  const [drafts, setDrafts] = useState<Drafts>({});

  // Mirrors `drafts` so the timer callback reads the newest values without
  // having to re-arm itself on every render.
  const draftsRef = useRef<Drafts>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Drafts>({});
  /** Submission order of the in-flight update — userError `field` indexes this. */
  const inFlightOrderRef = useRef<string[]>([]);
  const submitRef = useRef(fetcher.submit);
  submitRef.current = fetcher.submit;

  const mutating = useIsCartMutating();
  // The timer callback cannot read render state, and a flush that had to wait
  // needs somewhere to record that it is still owed.
  const busyRef = useRef(mutating);
  busyRef.current = mutating;
  const dueRef = useRef(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  // Prefer server cart qty so an optimistic Purchase bump cannot poison the
  // pre-add baseline used for clamp detection.
  useEffect(() => {
    if (mutating) return;
    syncQuantities(
      serverLines.map((line) => ({
        merchandiseId: line.merchandise?.id,
        quantity: line.quantity,
      })),
    );
  }, [mutating, serverLines, syncQuantities]);

  const commitDrafts = useCallback((next: Drafts) => {
    draftsRef.current = next;
    setDrafts(next);
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    dueRef.current = false;

    const entries = Object.entries(draftsRef.current);
    if (!entries.length) return;

    // One cart mutation at a time. LinesAdd applies a delta while this update
    // sets an absolute quantity, so overlapping them would re-increment on top
    // of the number the shopper picked.
    if (busyRef.current) {
      dueRef.current = true;
      return;
    }

    // Drafts still sitting on a placeholder id have to wait for the add; the
    // hygiene effect below moves them over once the saved line appears.
    const ready = entries.filter(([lineId]) => isSavedLineId(lineId));
    if (ready.length !== entries.length) dueRef.current = true;
    if (!ready.length) return;

    inFlightRef.current = Object.fromEntries(ready);
    inFlightOrderRef.current = ready.map(([id]) => id);

    const body = new FormData();
    body.set(
      CartForm.INPUT_NAME,
      JSON.stringify({
        action: CartForm.ACTIONS.LinesUpdate,
        inputs: {
          lines: ready.map(([id, draft]) => ({id, quantity: draft.quantity})),
        },
      }),
    );
    // Result is read through the fetcher, not awaited here.
    void submitRef.current(body, {method: 'POST', action: '/cart'});
  }, []);

  const setQuantity = useCallback(
    (line: CartLine, quantity: number) => {
      commitDrafts({
        ...draftsRef.current,
        [line.id]: {quantity, merchandiseId: line.merchandise?.id},
      });

      // A fresh edit supersedes whatever the last response said about this line.
      clearLineError(line.id);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [clearLineError, commitDrafts, flush],
  );

  const cancelQuantity = useCallback(
    (lineId: string) => {
      if (lineId in draftsRef.current) {
        const next = {...draftsRef.current};
        delete next[lineId];
        commitDrafts(next);

        if (!Object.keys(next).length && timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }

      clearLineError(lineId);
    },
    [clearLineError, commitDrafts],
  );

  // Send a pending edit rather than losing it when the drawer closes.
  useEffect(() => {
    return () => {
      if (timerRef.current) flush();
    };
  }, [flush]);

  // Release drafts once the server has answered for them. Doing this on the
  // response rather than on submit keeps the number from snapping backwards
  // mid-request, and lets a server-clamped quantity win.
  useEffect(() => {
    if (fetcher.state !== 'idle' || !fetcher.data) return;

    const submitted = inFlightRef.current;
    if (!Object.keys(submitted).length) return;
    inFlightRef.current = {};
    const submittedIds = inFlightOrderRef.current;
    inFlightOrderRef.current = [];

    const next = {...draftsRef.current};
    for (const [id, draft] of Object.entries(submitted)) {
      // Keep it if the shopper has since asked for something else.
      if (next[id]?.quantity === draft.quantity) delete next[id];
    }
    commitDrafts(next);

    const fromResponse = lineErrorsFromUpdateResponse(
      submittedIds,
      fetcher.data as CartActionData,
    );
    setLineErrors((prev) => {
      const nextErrors = {...prev};
      for (const id of submittedIds) {
        if (fromResponse[id]) nextErrors[id] = fromResponse[id];
        else delete nextErrors[id];
      }
      return nextErrors;
    });
  }, [commitDrafts, fetcher.state, fetcher.data, setLineErrors]);

  // Keep draft keys pointing at lines that exist, so nothing is submitted
  // against a dead id and nothing holds the cart in a busy state.
  const linesKey = lines.map((line) => line.id).join('|');
  useEffect(() => {
    const live = linesRef.current;
    const next: Drafts = {};
    let changed = false;

    for (const [lineId, draft] of Object.entries(draftsRef.current)) {
      if (lineId in inFlightRef.current || live.some((l) => l.id === lineId)) {
        next[lineId] = draft;
        continue;
      }

      // An add replaces its placeholder line with a saved one under a brand new
      // id. Carry the draft across, or the stepper would snap back to the
      // quantity the shopper started from.
      const saved = isSavedLineId(lineId)
        ? undefined
        : live.find(
            (l) =>
              isSavedLineId(l.id) &&
              draft.merchandiseId &&
              l.merchandise?.id === draft.merchandiseId,
          );
      if (saved) {
        next[saved.id] = draft;
        changed = true;
        continue;
      }

      // Still waiting on the mutation that should produce this line.
      if (!isSavedLineId(lineId) && busyRef.current) {
        next[lineId] = draft;
        continue;
      }

      // Its line is gone for good — a removal, or an add that never landed.
      // Holding on would pin the cart busy and lock checkout for good.
      changed = true;
    }

    if (changed) commitDrafts(next);
  }, [commitDrafts, linesKey, mutating]);

  // Run a flush that had to stand down, once the cart can take it. Declared
  // after the hygiene effect on purpose: within one commit that resolves an add,
  // hygiene rekeys the draft (writing draftsRef synchronously) before this runs,
  // so the submit below already carries the saved line id.
  useEffect(() => {
    if (dueRef.current && !mutating) flush();
  }, [flush, linesKey, mutating]);

  const hasDrafts = Object.keys(drafts).length > 0;

  // Publish drafts above `<Await>` so the navbar bag badge can move with +/-
  // during the debounce window, before LinesUpdate hits useOptimisticCart.
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const [id, draft] of Object.entries(drafts)) {
      next[id] = draft.quantity;
    }
    setDraftQuantities(next);
  }, [drafts, setDraftQuantities]);

  useEffect(() => {
    return () => setDraftQuantities({});
  }, [setDraftQuantities]);

  const value = useMemo<CartLineUpdatesValue>(
    () => ({
      setQuantity,
      cancelQuantity,
      getDraftQuantity: (lineId: string) => drafts[lineId]?.quantity,
      getLineError,
      isCartBusy: mutating || hasDrafts,
    }),
    [
      cancelQuantity,
      drafts,
      getLineError,
      hasDrafts,
      mutating,
      setQuantity,
    ],
  );

  return (
    <CartLineUpdatesContext.Provider value={value}>
      {children}
    </CartLineUpdatesContext.Provider>
  );
}

export function useCartLineUpdates() {
  const context = useContext(CartLineUpdatesContext);
  if (!context) {
    throw new Error(
      'useCartLineUpdates must be used within a CartLineUpdatesProvider',
    );
  }
  return context;
}

/** True while any fetcher is carrying a cart mutation. */
function useIsCartMutating() {
  const fetchers = useFetchers();
  return fetchers.some(
    (fetcher) =>
      fetcher.state !== 'idle' &&
      fetcher.formData?.get(CartForm.INPUT_NAME) != null,
  );
}
