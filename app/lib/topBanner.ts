/**
 * Announcement top banner: visibility + shop metafield copy.
 *
 * Height is `--top-banner-h` in design.css (`.top-banner` / mobile fold reclaim).
 * Copy: shop metafield `custom.announcement_texts` (`list.single_line_text_field`),
 * Storefront API access enabled.
 */

type ShopMetafield = {
  type?: string | null;
  value?: string | null;
} | null;

/** Paths where the banner is hidden (trailing slashes ignored). */
const TOP_BANNER_HIDDEN_PATHS = new Set<string>(['/']);

const DEFAULT_ANNOUNCEMENT_TEXTS = [
  'Free shipping on orders over ₱5,000',
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
