/**
 * Announcement top banner: visibility, shop metafield copy, and fallbacks.
 *
 * Visibility — shown on every route except paths in TOP_BANNER_HIDDEN_PATHS
 * (trailing slashes ignored). Height is `2rem` in design.css (`.top-banner` /
 * mobile product-fold reclaim); keep those in sync if you change it.
 *
 * Copy — shop metafield `custom.announcement_texts` (`list.single_line_text_field`).
 * Enable Storefront API access on the definition in Admin.
 */

type ShopMetafield = {
  type?: string | null;
  value?: string | null;
} | null;

/** Paths where the banner is hidden. */
export const TOP_BANNER_HIDDEN_PATHS = new Set<string>([
  '/', // home landing
]);

/** Fallback when the metafield is missing or empty. */
const DEFAULT_ANNOUNCEMENT_TEXTS = [
  'Free shipping on orders over P5,000',
  'Limited offer: Buy 4 samples, get 1 free',
] as const;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname || '/';
}

export function shouldShowTopBanner(pathname: string): boolean {
  return !TOP_BANNER_HIDDEN_PATHS.has(normalizePathname(pathname));
}

function parseListString(
  value: string | undefined | null,
): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every((item): item is string => typeof item === 'string')
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return undefined;
}

export function shopAnnouncementTexts(metafield: ShopMetafield): string[] {
  const parsed = parseListString(metafield?.value)
    ?.map((text) => text.trim())
    .filter(Boolean);
  return parsed?.length ? parsed : [...DEFAULT_ANNOUNCEMENT_TEXTS];
}
