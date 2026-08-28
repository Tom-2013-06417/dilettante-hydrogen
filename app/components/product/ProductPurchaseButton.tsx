import type {ProductFragment} from 'storefrontapi.generated';
import {AddToCartButton} from '~/components/cart';
import {useAside} from '~/components/layout';
import {
  isPreorderVariant,
  parsePreorderEta,
  preorderEtaIso,
} from '~/lib/preorder';
import {
  isVariantPurchasable,
  preordersEnabledFromRootData,
} from '~/lib/preordersEnabled';
import {useRouteLoaderData} from 'react-router';
import type {loader as rootLoader} from '~/root';

/**
 * Merge the product-page scent number onto the variant so optimistic cart
 * lines match the shape the cart query eventually returns.
 */
function withCartLineProductMetafields<
  T extends {product?: object | null},
>(variant: T, scentNumber: string, preorderEtaValue?: string | null): T {
  const number = scentNumber.trim();
  const eta = preorderEtaValue?.trim();
  if (!number && !eta) return variant;
  return {
    ...variant,
    product: {
      ...variant.product,
      ...(number ? {scentNumber: {value: number}} : {}),
      ...(eta ? {preorderEta: {type: 'date', value: eta}} : {}),
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
  /** custom.preorder_eta — stamped onto cart lines for fulfillment. */
  preorderEta?: ProductFragment['preorderEta'];
  /** 'inkwell' on the vellum hero; 'vellum' on the inkwell scenes panel. */
  tone?: keyof typeof TONE_CLASS;
  className?: string;
};

function purchaseButtonLabel(
  variant: ProductFragment['selectedOrFirstAvailableVariant'],
  preordersEnabled: boolean,
): string {
  if (!isVariantPurchasable(variant ?? null, preordersEnabled)) return 'Sold out';
  if (isPreorderVariant(variant ?? null, preordersEnabled)) return 'Pre-order';
  return 'Purchase';
}

/** Shared Purchase control — the hero band and the scenes panel both use it. */
export function ProductPurchaseButton({
  selectedVariant,
  scentNumber,
  preorderEta,
  tone = 'inkwell',
  className = '',
}: ProductPurchaseButtonProps) {
  const {open} = useAside();
  const rootData = useRouteLoaderData<typeof rootLoader>('root');
  const preordersEnabled = preordersEnabledFromRootData(rootData);
  const parsedEta = parsePreorderEta(preorderEta ?? null);
  const etaIso =
    parsedEta && preordersEnabled ? preorderEtaIso(parsedEta) : null;
  const purchasable = isVariantPurchasable(
    selectedVariant ?? null,
    preordersEnabled,
  );

  return (
    <AddToCartButton
      className={`${BUTTON_CLASS} ${TONE_CLASS[tone]} ${className}`}
      disabled={!purchasable}
      onClick={() => open('cart')}
      lines={
        selectedVariant
          ? [
              {
                merchandiseId: selectedVariant.id,
                quantity: 1,
                ...(etaIso
                  ? {attributes: [{key: '_preorder_eta', value: etaIso}]}
                  : {}),
                selectedVariant: withCartLineProductMetafields(
                  selectedVariant,
                  scentNumber,
                  etaIso,
                ),
              },
            ]
          : []
      }
    >
      {purchaseButtonLabel(selectedVariant, preordersEnabled)}
    </AddToCartButton>
  );
}
