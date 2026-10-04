import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {CartForm, Image, Money} from '@shopify/hydrogen';
import {useCallback, useEffect, useId, useRef, useState} from 'react';
import {Link, useRouteLoaderData} from 'react-router';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {CART_LINE_IMAGE_SIZE} from '~/lib/cartLineImage';
import type {CartUpsellVariant} from '~/lib/cartUpsell';
import {
  getPreorderBandMessage,
  isPreorderVariant,
  parsePreorderEta,
  preorderEtaIso,
} from '~/lib/preorder';
import {
  isVariantPurchasable,
  preordersEnabledFromRootData,
} from '~/lib/preordersEnabled';
import {useVariantUrl} from '~/lib/variants';
import type {loader as rootLoader} from '~/root';
import type {CartLine} from './CartLineItem';
import type {CartLayout} from './CartMain';

/** Every variant in the cart, including bundle components. */
function cartMerchandiseIds(lines: CartLine[], ids = new Set<string>()) {
  for (const line of lines) {
    if (line.merchandise?.id) ids.add(line.merchandise.id);
    if ('lineComponents' in line) cartMerchandiseIds(line.lineComponents, ids);
  }
  return ids;
}

/**
 * Tracks whether the track can scroll either way, and steps it one card at a
 * time. Scroll-snap does the landing, so a step only has to travel one card
 * plus the gap.
 */
function useCarousel(itemCount: number) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({prev: false, next: itemCount > 1});

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      // 1px of slack: fractional widths can leave scrollLeft just shy of max.
      const prev = track.scrollLeft > 1;
      const next = track.scrollLeft < max - 1;
      setEdges((current) =>
        current.prev === prev && current.next === next ? current : {prev, next},
      );
    };

    update();
    track.addEventListener('scroll', update, {passive: true});
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [itemCount]);

  const step = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !(card instanceof HTMLElement)) return;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    track.scrollBy({
      left: direction * (card.offsetWidth + gap),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  return {trackRef, canPrev: edges.prev, canNext: edges.next, step};
}

/**
 * "You may also like" — the 2 mL variants not already in the cart. Adding one
 * drops it from the list as soon as the optimistic line appears; removing that
 * line from the cart brings it back. Renders nothing once every variant is in
 * the cart.
 */
export function CartUpsell({
  layout,
  lines,
}: {
  layout: CartLayout;
  lines: CartLine[];
}) {
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const variants = rootData?.cartUpsellVariants ?? [];
  const inCart = cartMerchandiseIds(lines);
  const items = variants.filter(
    (variant) =>
      !inCart.has(variant.id) &&
      isVariantPurchasable(variant, preordersEnabled),
  );
  const {trackRef, canPrev, canNext, step} = useCarousel(items.length);
  const headingId = useId();

  if (!items.length) return null;

  const chevronClassName =
    'flex h-6 w-6 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100 disabled:cursor-default disabled:opacity-25';

  return (
    <div aria-labelledby={headingId} className="cart-upsell" role="region">
      <div className="flex items-center justify-between">
        <p
          className="font-['config-mono-vf'] text-[12px] uppercase tracking-[0.08em] text-vellum-100/80"
          id={headingId}
        >
          You may also like
        </p>
        <div className="flex items-center gap-1">
          <button
            aria-label="Previous suggestion"
            className={chevronClassName}
            disabled={!canPrev}
            onClick={() => step(-1)}
            type="button"
          >
            <ChevronLeftIcon aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            aria-label="Next suggestion"
            className={chevronClassName}
            disabled={!canNext}
            onClick={() => step(1)}
            type="button"
          >
            <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul
        aria-labelledby={headingId}
        className="cart-upsell-track"
        ref={trackRef}
      >
        {items.map((variant, index) => (
          <CartUpsellItem
            key={variant.id}
            eager={index === 0}
            layout={layout}
            preordersEnabled={preordersEnabled}
            variant={variant}
          />
        ))}
      </ul>

      <BlueprintRule orientation="h" className="w-full text-vellum-100/50" />
    </div>
  );
}

function CartUpsellItem({
  eager,
  layout,
  preordersEnabled,
  variant,
}: {
  eager: boolean;
  layout: CartLayout;
  preordersEnabled: boolean;
  variant: CartUpsellVariant;
}) {
  const {product, image, title, price, selectedOptions} = variant;
  const url = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const scentNumber = product.scentNumber?.value?.trim();
  const eta = parsePreorderEta(product.preorderEta ?? null);
  const preorderMessage = getPreorderBandMessage(
    variant,
    eta,
    preordersEnabled,
  );
  // Stamped on the line for fulfillment, as the product page's Purchase does.
  const etaIso =
    eta && isPreorderVariant(variant, preordersEnabled)
      ? preorderEtaIso(eta)
      : null;

  return (
    <li className="cart-upsell-item">
      <div className="flex items-start">
        {image ? (
          <div className="cart-upsell-media">
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              crop="center"
              data={image}
              // Same request size as the cart line, so both share a CDN URL.
              height={CART_LINE_IMAGE_SIZE}
              loading={eager ? 'eager' : 'lazy'}
              width={CART_LINE_IMAGE_SIZE}
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {scentNumber ? (
            <span className="block font-['config-mono-vf'] text-[11px] font-medium leading-none tracking-[0.02em] [font-variant-numeric:slashed-zero]">
              No. {scentNumber}
            </span>
          ) : null}
          <Link
            className="block min-w-0"
            prefetch="intent"
            to={url}
            onClick={() => {
              if (layout === 'aside') close();
            }}
          >
            <p className="mt-1! truncate font-['wayfinder-cf'] text-[26px] font-thin leading-none! tracking-[-5%]">
              {product.title}
            </p>
          </Link>
          <span className="mt-1 block text-[12px] leading-none">{title}</span>
          {preorderMessage ? (
            <p className="mt-1.5! font-['trust-3a'] text-[11px] leading-snug tracking-[0.04em] text-vellum-100/75">
              {preorderMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <Money
          as="span"
          className="font-['config-mono-vf'] text-[14px] tracking-[0.04em]"
          data={price}
        />
        <CartForm
          action={CartForm.ACTIONS.LinesAdd}
          // One fetcher per variant so quick successive adds don't cancel
          // each other's submissions.
          fetcherKey={`cart-upsell-add-${variant.id}`}
          inputs={{
            lines: [
              {
                merchandiseId: variant.id,
                quantity: 1,
                ...(etaIso
                  ? {attributes: [{key: '_preorder_eta', value: etaIso}]}
                  : {}),
                selectedVariant: variant,
              },
            ],
          }}
          route="/cart"
        >
          <button
            className="h-8 cursor-pointer border border-current px-4 font-['config-mono-vf'] text-[12px] uppercase tracking-[0.08em] transition-colors hover:bg-vellum-100 hover:text-inkwell-700"
            type="submit"
          >
            Add
          </button>
        </CartForm>
      </div>
    </li>
  );
}
