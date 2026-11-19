import type {OptimisticCartLineInput} from '@shopify/hydrogen';
import {
  CART_UPSELL_VARIANT_IDS,
  type CartUpsellVariant,
} from '~/lib/cartUpsell';
import {DEBUT_COLLECTION_HANDLE} from '~/lib/constants';
import {
  isPreorderVariant,
  parsePreorderEta,
  preorderEtaIso,
} from '~/lib/preorder';

/**
 * Collection Sample Set card still adds the five 2 mL variants as separate
 * lines; the cart total lands on SET_PRICE via the admin's "25% off 5+
 * samples" automatic discount.
 */
export const SAMPLE_SET_PRICE = '1500.0';
export const SAMPLE_SET_COMPARE_AT_PRICE = '2000.0';
export const SAMPLE_SET_VOLUME_TITLE = '2 mL';

/** Dedicated Discovery Set product (unlisted; sold on `/discovery-set`). */
export const DISCOVERY_SET_PRODUCT_ID =
  'gid://shopify/Product/15525744443482';

export const DISCOVERY_SET_TITLE = 'Discovery Set';
export const DISCOVERY_SET_TAGLINE =
  'Five samples to help you find your favorites.';
export const DISCOVERY_SET_FOOTNOTE =
  'Includes x5 2ml samples and a discount code for 10% off on your next full bottle purchase.';

/**
 * Prefer a variant named for the active collection (e.g. "Debut Collection");
 * fall back to the first variant (Default Title until options are set).
 */
export function discoverySetVariant<
  T extends {
    title?: string | null;
    selectedOptions?: Array<{name: string; value: string}> | null;
  },
>(variants: T[]): T | null {
  if (!variants.length) return null;
  const debutLabel = DEBUT_COLLECTION_HANDLE.replace(/-/g, ' ');
  const match = variants.find((variant) => {
    const title = variant.title?.trim().toLowerCase() ?? '';
    const option = variant.selectedOptions?.find(
      (o) => o.value.trim().toLowerCase() === debutLabel,
    );
    return Boolean(option) || title === debutLabel;
  });
  return match ?? variants[0] ?? null;
}

function scentNumberOf(variant: CartUpsellVariant) {
  return variant.product.scentNumber?.value?.trim() ?? '';
}

/** Five 2 mL lines in scent-number order, stamped with preorder ETA when needed. */
export function sampleSetLines(
  variants: CartUpsellVariant[],
  preordersEnabled: boolean,
): OptimisticCartLineInput[] {
  return [...variants]
    .sort((a, b) => scentNumberOf(a).localeCompare(scentNumberOf(b)))
    .map((variant) => {
      const eta = parsePreorderEta(variant.product.preorderEta ?? null);
      const etaIso =
        eta && isPreorderVariant(variant, preordersEnabled)
          ? preorderEtaIso(eta)
          : null;
      return {
        merchandiseId: variant.id,
        quantity: 1,
        ...(etaIso
          ? {attributes: [{key: '_preorder_eta', value: etaIso}]}
          : {}),
        selectedVariant: variant,
      };
    });
}

/** True when every hardcoded 2 mL variant is available to sell. */
export function sampleSetAvailable(variants: CartUpsellVariant[]): boolean {
  return variants.length === CART_UPSELL_VARIANT_IDS.length;
}
