import {DEBUT_COLLECTION_HANDLE} from '~/lib/constants';

export const SAMPLE_SET_VOLUME_TITLE = '2 mL';

/** Dedicated Discovery Set product (unlisted; sold on `/discovery-set`). */
export const DISCOVERY_SET_PRODUCT_ID =
  'gid://shopify/Product/15525744443482';

export const DISCOVERY_SET_TITLE = 'Discovery Set';
export const DISCOVERY_SET_TAGLINE =
  'Five samples to help you find your favorites.';
export const DISCOVERY_SET_FOOTNOTE =
  'Includes a discount code for 10% off your next full-bottle purchase.';

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
