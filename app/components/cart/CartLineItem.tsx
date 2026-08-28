import {MinusIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline';
import {ExclamationTriangleIcon} from '@heroicons/react/16/solid';
import type {CartLayout, LineItemChildrenMap} from './CartMain';
import {useCartLineUpdates} from './CartLineUpdates';
import {
  CartForm,
  Image,
  Money,
  type OptimisticCartLine,
} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {AnimatePresence, motion} from 'motion/react';
import {useEffect, useState} from 'react';
import {useVariantUrl} from '~/lib/variants';
import {CART_LINE_IMAGE_SIZE} from '~/lib/cartLineImage';
import {fetchPriorityAttr} from '~/lib/fetchPriority';
import {getPreorderCartMessage} from '~/lib/preorder';
import {preordersEnabledFromRootData} from '~/lib/preordersEnabled';
import {Link, useRouteLoaderData} from 'react-router';
import {useAside} from '~/components/layout';
import type {loader as rootLoader} from '~/root';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

/**
 * How long the unit price takes to slide in or out.
 * Must match the animation duration in `.cart-line-unit-price` (app.css).
 */
const UNIT_PRICE_ANIMATION_MS = 240;

/** Matches the subscribe email error motion. */
const QTY_ERROR_MOTION = {
  initial: {opacity: 0, y: -6},
  animate: {opacity: 1, y: 0},
  exit: {opacity: 0, y: -6},
  transition: {duration: 0.15, ease: 'easeOut' as const},
};

/**
 * Keeps a element rendered for `ms` after it stops being wanted, so it can
 * animate out — React would otherwise drop it from the tree the same frame and
 * there would be nothing left to animate.
 *
 * Returns whether to render it at all, separately from whether it is on its way
 * out, so the caller can swap the animation.
 */
function useRetreat(visible: boolean, ms: number) {
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      return;
    }
    const timer = setTimeout(() => setRendered(false), ms);
    return () => clearTimeout(timer);
  }, [ms, visible]);

  return {rendered, retreating: rendered && !visible};
}

/**
 * A single line item in the cart. It displays the product image, title, price.
 * It also provides controls to update the quantity or remove the line item.
 * If the line is a parent line that has child components (like warranties or gift wrapping), they are
 * rendered nested below the parent line.
 */
export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];
  const childrenLabelId = `cart-line-children-${id}`;
  const scentNumber = product.scentNumber?.value?.trim();
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const preorderMessage = getPreorderCartMessage(
    merchandise,
    line.attributes,
    product.preorderEta ?? null,
    preordersEnabled,
  );
  const {getDraftQuantity, getLineError} = useCartLineUpdates();
  // A queued quantity has not reached the server yet, so it wins over the
  // server value for both the stepper and the subtotal below.
  const quantity = getDraftQuantity(id) ?? line.quantity;
  const quantityError = getLineError(id);
  const unitPrice = line?.cost?.amountPerQuantity ?? merchandise.price;
  // At quantity 1 the per-piece price would only restate the subtotal.
  const {rendered: showUnitPrice, retreating} = useRetreat(
    quantity > 1 && !!unitPrice,
    UNIT_PRICE_ANIMATION_MS,
  );

  return (
    <li key={id} className="cart-line relative">
      <CartLineRemoveButton
        className="absolute right-0 top-2 z-10"
        lineIds={[id]}
        disabled={!!line.isOptimistic}
      />

      <div className="cart-line-inner">
        {image && (
          <div className="cart-line-media">
            <Image
              alt={title}
              aspectRatio="1/1"
              crop="center"
              data={image}
              // Eager: the drawer opens into view; lazy would delay the request.
              // Size matches cartLineImage.ts so the product-page prefetch hits.
              {...fetchPriorityAttr('high')}
              height={CART_LINE_IMAGE_SIZE}
              loading="eager"
              width={CART_LINE_IMAGE_SIZE}
            />
          </div>
        )}

        <div className="min-w-0 flex-1 pr-8">
          {scentNumber ? (
            <span className="block font-['config-mono-vf'] text-[12px] font-medium leading-none tracking-[0.02em] [font-variant-numeric:slashed-zero]">
              No. {scentNumber}
            </span>
          ) : null}

          <Link
            className="block min-w-0"
            prefetch="intent"
            to={lineItemUrl}
            onClick={() => {
              if (layout === 'aside') {
                close();
              }
            }}
          >
            {/* Important modifiers: reset.css is unlayered, so its `p` rules
                (line-height: 1.25, margin: 0) outrank layered utilities. */}
            <p className="mt-1! truncate font-['wayfinder-cf'] text-[36px] font-thin leading-none! tracking-[-5%]">
              {product.title}
            </p>
          </Link>

          {/* The per-piece price only earns its space once there is more than
              one piece; at quantity 1 it just restates the subtotal. */}
          <span className="cart-line-size mt-1 block text-[13px] leading-none">
            {showUnitPrice && unitPrice ? (
              <span
                className={`cart-line-unit-price text-vellum-100/80 ${
                  retreating ? 'is-retreating' : ''
                }`.trim()}
              >
                <Money as="span" data={unitPrice} />
                {' / '}
              </span>
            ) : null}
            {title}
          </span>
          {preorderMessage ? (
            <span className="mt-1.5 block font-['trust-3a'] text-[11px] leading-snug tracking-[0.04em] text-vellum-100/75">
              {preorderMessage}
            </span>
          ) : null}
        </div>
      </div>

      {/* Prices stack on the left, stepper on the right. Error slot is always
          reserved below so enter/exit never shifts following content. */}
      <div className="mt-3 mb-3 flex items-end justify-between gap-3">
        {unitPrice ? (
          <div className="min-w-0 font-['config-mono-vf'] tracking-[0.04em]">
            <span className="block text-[10px] uppercase tracking-[0.08em] text-vellum-100/60">
              Subtotal
            </span>
            <Money
              as="span"
              className="mt-px block text-[16px]"
              data={lineSubtotal(unitPrice, quantity)}
            />
          </div>
        ) : null}
        <CartLineQuantity line={line} quantity={quantity} />
      </div>
      <div className="relative h-3 overflow-hidden">
        <AnimatePresence>
          {quantityError ? (
            <motion.p
              key="cart-line-qty-error"
              {...QTY_ERROR_MOTION}
              className="absolute inset-x-0 top-0 m-0 flex h-3 items-center justify-end gap-1.5 font-['trust-3a'] text-[11px] leading-none tracking-[0.02em] text-vellum-100/80"
              role="alert"
            >
              <ExclamationTriangleIcon
                aria-hidden="true"
                className="size-3 shrink-0"
              />
              <span className="min-w-0 truncate">{quantityError}</span>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {lineItemChildren ? (
        <div>
          <p id={childrenLabelId} className="sr-only">
            Line items with {product.title}
          </p>
          <ul aria-labelledby={childrenLabelId} className="cart-line-children">
            {lineItemChildren.map((childLine) => (
              <CartLineItem
                childrenMap={childrenMap}
                key={childLine.id}
                line={childLine}
                layout={layout}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

/**
 * The line subtotal, multiplied in the browser so a quantity change prices
 * itself immediately instead of waiting for the cart mutation to come back.
 * `Money` formats through Intl at the currency's own precision, so the float
 * multiply here can never surface as a wrong cent.
 */
function lineSubtotal(unitPrice: MoneyV2, quantity: number): MoneyV2 {
  return {...unitPrice, amount: String(Number(unitPrice.amount) * quantity)};
}

/**
 * Provides the controls to update the quantity of a line item in the cart.
 * They stay live on a line the server has not saved yet — the drawer opens
 * mid-add and a dead stepper is exactly what a shopper reaches for first. The
 * provider holds the request back until the line has a real id.
 *
 * `quantity` is passed in rather than read off the line so the stepper and the
 * subtotal beside it can never disagree.
 */
function CartLineQuantity({
  line,
  quantity: displayed,
}: {
  line: CartLine;
  quantity: number;
}) {
  const {setQuantity} = useCartLineUpdates();
  if (!line || typeof line?.quantity === 'undefined') return null;

  // The box's width comes from --cart-line-stepper-width, so the three cells
  // divide that width rather than setting their own and overflowing it.
  // The glyph dips on press — the button's own box is transparent inside the
  // bordered group, so scaling it reads as the icon being pushed in.
  const buttonClassName =
    'flex h-8 flex-1 cursor-pointer items-center justify-center transition-transform duration-100 ease-out active:scale-75 disabled:cursor-default disabled:opacity-40';

  return (
    <div className="cart-line-quantity items-center border border-current">
      <button
        aria-label="Decrease quantity"
        className={buttonClassName}
        disabled={displayed <= 1}
        onClick={() => setQuantity(line, displayed - 1)}
        type="button"
      >
        <MinusIcon className="h-3 w-3" aria-hidden="true" />
      </button>
      <span
        aria-live="polite"
        className="flex-1 text-center font-['config-mono-vf'] text-[12px] leading-none [font-variant-numeric:slashed-zero]"
      >
        {displayed}
      </span>
      <button
        aria-label="Increase quantity"
        className={buttonClassName}
        onClick={() => setQuantity(line, displayed + 1)}
        type="button"
      >
        <PlusIcon className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * A button that removes a line item from the cart. It is disabled
 * when the line item is new, and the server hasn't yet responded
 * that it was successfully added to the cart.
 */
function CartLineRemoveButton({
  lineIds,
  disabled,
  className = '',
}: {
  lineIds: string[];
  disabled: boolean;
  className?: string;
}) {
  const {cancelQuantity} = useCartLineUpdates();

  return (
    <CartForm
      fetcherKey={getLineActionKey(CartForm.ACTIONS.LinesRemove, lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button
        aria-label="Remove from cart"
        className={`flex h-6 w-6 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40 ${className}`.trim()}
        disabled={disabled}
        // Drop any pending draft so the debounce cannot resurrect this line.
        onClick={() => lineIds.forEach(cancelQuantity)}
        type="submit"
      >
        <TrashIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </CartForm>
  );
}

/**
 * Returns a unique key per action + line, so that actions modifying the same
 * line items are not run concurrently but cancel each other.
 * @param action - the cart action being performed
 * @param lineIds - line ids affected by the action
 */
function getLineActionKey(action: string, lineIds: string[]) {
  return [action, ...lineIds].join('-');
}
