/**
 * Typed Shopify metafields used for collection pages.
 *
 * Define in Admin → Settings → Custom data → Collections, then enable
 * Storefront API access for each definition:
 * - custom.launch_date (Date) → header date “MMM . YYYY”
 * - custom.tagline (Single line text) → italic line under the title
 */

export type StorefrontCollectionMetafield = {
  type: string;
  value?: string | null;
} | null;

export type CollectionMetafieldsInput = {
  launchDate: StorefrontCollectionMetafield;
  tagline: StorefrontCollectionMetafield;
};

export type ParsedCollectionMetafields = {
  /** Formatted for display, e.g. "AUG . 2026". */
  launchDateLabel?: string;
  tagline?: string;
};

const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const;

/**
 * Format a Shopify date metafield value (`YYYY-MM-DD`) as `MMM . YYYY`.
 * Matches the collection header treatment in Figma (e.g. "AUG . 2026").
 */
export function formatLaunchDateLabel(
  value: string | undefined | null,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return undefined;

  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11 || !year) return undefined;

  return `${MONTHS[monthIndex]}.${year}`;
}

function textValue(
  metafield: StorefrontCollectionMetafield,
): string | undefined {
  const value = metafield?.value?.trim();
  return value || undefined;
}

export function parseCollectionMetafields(
  fields: CollectionMetafieldsInput,
): ParsedCollectionMetafields {
  return {
    launchDateLabel: formatLaunchDateLabel(fields.launchDate?.value),
    tagline: textValue(fields.tagline),
  };
}
