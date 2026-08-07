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
  "cursor-pointer border-0 bg-[#152015] px-5 py-2.5 font-['config-mono-vf'] text-[13px] font-bold uppercase tracking-[0.08em] text-vellum-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-3 sm:text-[14px]";

type ProductPurchaseButtonProps = {
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  /** Stitched into the optimistic cart line so "No." paints immediately. */
  scentNumber: string;
  className?: string;
};

/** Shared Purchase control — the hero band and the scenes panel both use it. */
export function ProductPurchaseButton({
  selectedVariant,
  scentNumber,
  className = '',
}: ProductPurchaseButtonProps) {
  const {open} = useAside();

  return (
    <AddToCartButton
      className={`${BUTTON_CLASS} ${className}`}
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
