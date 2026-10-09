import {useEffect, useRef, useState} from 'react';
import {useOptimisticCart} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {EmptyBasket} from '~/assets/illustrations/EmptyBasket';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {CartLineItem, type CartLine} from './CartLineItem';
import {CartLineUpdatesProvider} from './CartLineUpdates';
import {CartSummary} from './CartSummary';
import {CartUpsell} from './CartUpsell';

export type CartLayout = 'page' | 'aside';

export type CartMainProps = {
  cart: CartApiQueryFragment | null;
  layout: CartLayout;
};

export type LineItemChildrenMap = {[parentId: string]: CartLine[]};
/** Returns a map of all line items and their children. */
function getLineItemChildrenMap(lines: CartLine[]): LineItemChildrenMap {
  const children: LineItemChildrenMap = {};
  for (const line of lines) {
    if ('parentRelationship' in line && line.parentRelationship?.parent) {
      const parentId = line.parentRelationship.parent.id;
      if (!children[parentId]) children[parentId] = [];
      children[parentId].push(line);
    }
    if ('lineComponents' in line) {
      const lineChildren = getLineItemChildrenMap(line.lineComponents);
      for (const [parentId, childIds] of Object.entries(lineChildren)) {
        if (!children[parentId]) children[parentId] = [];
        children[parentId].push(...childIds);
      }
    }
  }
  return children;
}
/**
 * The main cart component that displays the cart items and summary.
 * Used by the cart aside (GET /cart redirects into the aside via `?cart=t`).
 */
export function CartMain({layout, cart: originalCart}: CartMainProps) {
  // The useOptimisticCart hook applies pending actions to the cart
  // so the user immediately sees feedback when they modify the cart.
  const cart = useOptimisticCart(originalCart);

  const withDiscount =
    cart &&
    Boolean(cart?.discountCodes?.filter((code) => code.applicable)?.length);
  const className = `cart-main ${withDiscount ? 'with-discount' : ''}`;
  const cartHasItems = cart?.totalQuantity ? cart.totalQuantity > 0 : false;
  const lines = cart?.lines?.nodes ?? [];
  const childrenMap = getLineItemChildrenMap(lines);
  // The Cart API and useOptimisticCart both put the newest line first; list
  // oldest first so an add lands at the bottom.
  const rootLines = lines
    .filter(
      (line) =>
        !('parentRelationship' in line && line.parentRelationship?.parent),
    )
    .reverse();
  const rows = useLeavingRows(rootLines);

  useEffect(() => {
    shownLineKeys = new Set(rootLines.flatMap(lineKeys));
  });

  return (
    <section
      className={className}
      aria-label={layout === 'page' ? 'Cart page' : 'Cart drawer'}
    >
      {/* One tree for empty and filled carts, so the summary stays mounted
          and can slide out when the last line goes. */}
      <CartLineUpdatesProvider
        layout={layout}
        lines={lines}
        serverLines={originalCart?.lines?.nodes ?? []}
      >
        <div className="cart-details">
          <div className="cart-line-list">
            {/* Rows rather than cartHasItems, so the last line can animate out. */}
            {rows.length > 0 ? (
              <>
                <p id="cart-lines" className="sr-only">
                  Line items
                </p>
                <ul aria-labelledby="cart-lines">
                  {rows.map(({line, leaving}) => (
                    <CartLineRow
                      key={line.id}
                      line={line}
                      leaving={leaving}
                      layout={layout}
                      childrenMap={childrenMap}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <CartEmpty layout={layout} />
            )}
            <CartUpsell layout={layout} lines={lines} />
          </div>
          <CartSummaryReveal open={cartHasItems}>
            <CartSummary cart={cart} layout={layout} />
          </CartSummaryReveal>
        </div>
      </CartLineUpdatesProvider>
    </section>
  );
}

/**
 * How long a removed line stays mounted: a 60ms fade, then a 60ms collapse.
 * Must match the `.cart-line-row[data-leaving]` animations (app.css).
 */
const LINE_LEAVE_MS = 120;

/**
 * Ids and merchandise ids of the lines on screen at the last commit. Module
 * scope for the same reason as `summaryWasOpen`: a remount inside `<Await>`
 * must not replay the entrance for lines already showing. Merchandise ids are
 * kept so an add swapping its placeholder line for the saved one (new id, same
 * variant) does not count as new either. Undefined until the first mount, so a
 * page load never animates.
 */
let shownLineKeys: Set<string> | undefined;

function lineKeys(line: CartLine) {
  return line.merchandise?.id ? [line.id, line.merchandise.id] : [line.id];
}

function isSameLine(a: CartLine, b: CartLine) {
  return (
    a.id === b.id ||
    (!!a.merchandise?.id && a.merchandise.id === b.merchandise?.id)
  );
}

type CartLineRowData = {line: CartLine; leaving?: boolean};

/**
 * The lines to render: the current ones, plus removed ones held in their old
 * slot for LINE_LEAVE_MS so they can animate out. The optimistic cart drops a
 * removed line the moment the action is submitted, so this has to catch it in
 * render — an effect would paint one frame without it.
 */
function useLeavingRows(lines: CartLine[]): CartLineRowData[] {
  const key = lines.map((line) => line.id).join('|');
  const [state, setState] = useState(() => ({
    key,
    rows: lines.map((line): CartLineRowData => ({line})),
  }));

  let rows = state.rows;
  if (state.key !== key) {
    const unclaimed = new Set(lines);
    const claim = (line: CartLine) => {
      const match =
        [...unclaimed].find((next) => next.id === line.id) ??
        [...unclaimed].find((next) => isSameLine(next, line));
      if (match) unclaimed.delete(match);
      return match;
    };

    rows = state.rows.map((row) => {
      const next = claim(row.line);
      return next ? {line: next} : {line: row.line, leaving: true};
    });
    lines.forEach((line, index) => {
      if (!unclaimed.has(line)) return;
      const before = lines[index - 1];
      const at = before ? rows.findIndex((row) => row.line === before) + 1 : 0;
      rows.splice(at, 0, {line});
    });
    setState({key, rows});
  }

  const leavingKey = rows
    .filter((row) => row.leaving)
    .map((row) => row.line.id)
    .join('|');
  useEffect(() => {
    if (!leavingKey) return;
    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        rows: prev.rows.filter((row) => !row.leaving),
      }));
    }, LINE_LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leavingKey]);

  // Stored rows only fix order; quantities and prices come from this render.
  const byId = new Map(lines.map((line) => [line.id, line]));
  return rows.map((row) =>
    row.leaving ? row : {line: byId.get(row.line.id) ?? row.line},
  );
}

/**
 * One top-level cart line and the rule above it. A line that was not on screen
 * at the last commit drops in from above; a removed one fades down and then
 * collapses so the lines below close the gap.
 */
function CartLineRow({
  line,
  leaving,
  layout,
  childrenMap,
}: {
  line: CartLine;
  leaving?: boolean;
  layout: CartLayout;
  childrenMap: LineItemChildrenMap;
}) {
  const [entering] = useState(
    () =>
      shownLineKeys !== undefined &&
      !lineKeys(line).some((key) => shownLineKeys?.has(key)),
  );

  return (
    <li
      className="cart-line-row"
      data-entering={entering || undefined}
      data-leaving={leaving || undefined}
    >
      <div>
        <div aria-hidden="true" className="cart-line-divider">
          <div className="py-1">
            <BlueprintRule
              orientation="h"
              className="w-full text-vellum-100/50"
            />
          </div>
        </div>
        <CartLineItem line={line} layout={layout} childrenMap={childrenMap} />
      </div>
    </li>
  );
}

/**
 * Open state the summary last rendered with. Module scope because CartMain
 * remounts inside `<Await>` on cart revalidation: a fresh mount starts from
 * here, so an add that lands with the remount still slides in rather than
 * appearing open. Undefined until the first mount, so a page load never
 * animates. Only written in effects, so the server never touches it.
 */
let summaryWasOpen: boolean | undefined;

/**
 * Slides the summary up from the drawer's bottom edge when the cart gains its
 * first line, and back down when it empties. The collapse is a height
 * transition, so whatever sits above it — the pinned upsell — rides along.
 */
function CartSummaryReveal({
  children,
  open,
}: {
  children: React.ReactNode;
  open: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => summaryWasOpen ?? open);

  useEffect(() => {
    summaryWasOpen = open;
    if (shown === open) return;
    // Commit the start state first: on a fresh mount the browser would
    // otherwise fold both states into one style pass and skip the transition.
    ref.current?.getBoundingClientRect();
    setShown(open);
  }, [open, shown]);

  return (
    <div
      className="cart-summary-reveal"
      data-open={shown || undefined}
      ref={ref}
    >
      {/* Unpadded, so the collapsed row can reach zero: a grid item never
          shrinks past its own padding and border. */}
      <div>{children}</div>
    </div>
  );
}

function CartEmpty({layout}: {layout?: CartMainProps['layout']}) {
  const {close} = useAside();
  const isAside = layout === 'aside';

  return (
    <div
      className={
        isAside
          ? 'flex flex-1 flex-col justify-center gap-5'
          : 'flex flex-col justify-center gap-5 py-16'
      }
    >
      <EmptyBasket className="mx-auto h-16 w-16 text-vellum-100" />
      <p className="px-8 text-center sm:px-10">Your cart is empty.</p>
      <button
        className="reset mx-auto mb-25 cursor-pointer text-center underline! underline-offset-4 transition-opacity hover:opacity-80"
        type="button"
        onClick={close}
      >
        Continue shopping →
      </button>
    </div>
  );
}
