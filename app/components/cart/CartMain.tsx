import {Fragment, useEffect, useRef, useState} from 'react';
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
  const rootLines = lines.filter(
    (line) =>
      !('parentRelationship' in line && line.parentRelationship?.parent),
  );
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
            {cartHasItems ? (
              <>
                <p id="cart-lines" className="sr-only">
                  Line items
                </p>
                <ul aria-labelledby="cart-lines">
                  {rootLines.map((line, index) => (
                    <Fragment key={line.id}>
                      {index > 0 ? (
                        <li aria-hidden="true" className="list-none py-1">
                          <BlueprintRule
                            orientation="h"
                            className="w-full text-vellum-100/50"
                          />
                        </li>
                      ) : null}
                      <CartLineItem
                        line={line}
                        layout={layout}
                        childrenMap={childrenMap}
                      />
                    </Fragment>
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
