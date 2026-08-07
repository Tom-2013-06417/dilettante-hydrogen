import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';

/**
 * Merge the product-page scent number onto the variant so optimistic cart
 * lines match the shape the cart query eventually returns.
 */
function withCartLineScentNumber<T extends {product?: object | null}>(
  variant: T,
  scentNumber: string,
): T {
  const value = scentNumber.trim();
  if (!value) return variant;
  return {
    ...variant,
    product: {
      ...variant.product,
      scentNumber: {value},
    },
  };
}

const BUTTON_CLASS =
  "cursor-pointer border-0 px-5 py-2.5 font-['config-mono-vf'] text-[13px] font-bold uppercase tracking-[0.08em] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-3 sm:text-[14px]";

/**
 * Set as whole classes rather than left to the caller to override: two
 * competing bg-* utilities resolve by stylesheet order, not by which one the
 * caller passed last.
 */
const TONE_CLASS = {
  inkwell: 'bg-[#152015] text-vellum-100',
  vellum: 'bg-vellum-100 text-inkwell-700',
} as const;

type ProductPurchaseButtonProps = {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  /** Stitched into the optimistic cart line so "No." paints immediately. */
  scentNumber: string;
  /** 'inkwell' on the vellum hero; 'vellum' on the inkwell scenes panel. */
  tone?: keyof typeof TONE_CLASS;
  className?: string;
};

/** Shared Purchase control — the hero band and the scenes panel both use it. */
export function ProductPurchaseButton({
  selectedVariant,
  scentNumber,
  tone = 'inkwell',
  className = '',
}: ProductPurchaseButtonProps) {
  const {open} = useAside();

  return (
    <AddToCartButton
      className={`${BUTTON_CLASS} ${TONE_CLASS[tone]} ${className}`}
      disabled={!selectedVariant?.availableForSale}
      onClick={() => open('cart')}
      lines={
        selectedVariant
          ? [
              {
                merchandiseId: selectedVariant.id,
                quantity: 1,
                selectedVariant: withCartLineScentNumber(
                  selectedVariant,
                  scentNumber,
                ),
              },
            ]
          : []
      }
    >
      {selectedVariant?.availableForSale ? 'Purchase' : 'Sold out'}
    </AddToCartButton>
  );
}
