/**
 * Preorder helpers — derive UI from variant inventory + custom.preorder_eta.
 *
 * Enable "Continue selling when out of stock" in Admin; set a future date on
 * custom.preorder_eta. Storefront reads currentlyNotInStock + the date metafield.
 */

type PreorderMetafield = {
  type?: string | null;
  value?: string | null;
} | null;

type PreorderVariant = {
  currentlyNotInStock?: boolean | null;
  availableForSale?: boolean | null;
} | null;

/** Shopify date metafields store ISO dates (YYYY-MM-DD). */
export function parsePreorderEta(
  metafield: PreorderMetafield,
): Date | null {
  const raw = metafield?.value?.trim();
  if (!raw) return null;

  const [year, month, day] = raw.split('-').map(Number);
  if (!year || !month || !day) return null;

  // Local midnight so month-bucket checks match merchant intent.
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/** ISO date string for cart line attributes / Admin visibility. */
export function preorderEtaIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Variant is purchasable but has no on-hand stock (continue-selling policy). */
export function isPreorderVariant(
  variant: PreorderVariant,
  preordersEnabled = true,
): boolean {
  if (!preordersEnabled) return false;
  return variant?.currentlyNotInStock === true;
}

/** True when we should show an ETA line (backorder + future date on file). */
export function isPreorderActive(
  variant: PreorderVariant,
  eta: Date | null,
  preordersEnabled = true,
): boolean {
  if (!isPreorderVariant(variant, preordersEnabled) || !eta) return false;

  const today = startOfDay(new Date());
  return startOfDay(eta) >= today;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

type PreorderMonthWindow = 'early' | 'mid' | 'late';

/** Map day-of-month to early / mid / late (days 1–10, 11–20, 21–end). */
function preorderMonthWindow(date: Date): PreorderMonthWindow {
  const day = date.getDate();
  if (day <= 10) return 'early';
  if (day <= 20) return 'mid';
  return 'late';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** "Ships early September", "Ships mid September", or "Ships late September". */
export function formatPreorderMessage(eta: Date): string {
  const month = MONTH_NAMES[eta.getMonth()]!;
  const window = preorderMonthWindow(eta);
  return `Ships ${window} ${month}`;
}

/** Customer-facing cart line note. */
export function formatPreorderCartMessage(eta: Date): string {
  return formatPreorderMessage(eta);
}

export function getPreorderBandMessage(
  variant: PreorderVariant,
  eta: Date | null,
  preordersEnabled = true,
): string | null {
  if (!isPreorderActive(variant, eta, preordersEnabled)) return null;
  return formatPreorderMessage(eta!);
}

/** Resolve ETA from a cart line attribute or the product metafield. */
export function preorderEtaFromCartLine(
  attributes: Array<{key: string; value?: string | null}> | null | undefined,
  productMetafield: PreorderMetafield,
): Date | null {
  const fromAttr = attributes?.find((a) => a.key === '_preorder_eta')?.value;
  if (fromAttr) {
    const parsed = parsePreorderEta({value: fromAttr});
    if (parsed) return parsed;
  }
  return parsePreorderEta(productMetafield);
}

export function getPreorderCartMessage(
  variant: PreorderVariant,
  attributes: Array<{key: string; value?: string | null}> | null | undefined,
  productMetafield: PreorderMetafield,
  preordersEnabled = true,
): string | null {
  const eta = preorderEtaFromCartLine(attributes, productMetafield);
  if (!isPreorderActive(variant, eta, preordersEnabled)) return null;
  return formatPreorderCartMessage(eta!);
}
