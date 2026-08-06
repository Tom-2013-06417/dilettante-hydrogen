export const SITE_TITLE = 'Dilettante';

/** Sole storefront collection until multi-collection UX ships. */
export const DEBUT_COLLECTION_HANDLE = 'debut-collection';

export function pageTitle(...parts: Array<string | undefined | null>) {
  const suffix = parts.filter(Boolean).join(' | ');
  return suffix ? `${SITE_TITLE} | ${suffix}` : SITE_TITLE;
}

/** Query flag that opens the cart aside (no dedicated cart page). */
export const CART_OPEN_SEARCH_PARAM = 'cart';
export const CART_OPEN_SEARCH_VALUE = 't';
/** Where GET /cart redirects; aside opens via the query flag. */
export const CART_OPEN_REDIRECT_PATH = '/collections';

export function cartOpenHref(path: string = CART_OPEN_REDIRECT_PATH) {
  const params = new URLSearchParams({
    [CART_OPEN_SEARCH_PARAM]: CART_OPEN_SEARCH_VALUE,
  });
  return `${path}?${params.toString()}`;
}

export function shouldOpenCartFromSearch(search: string) {
  const value = new URLSearchParams(search).get(CART_OPEN_SEARCH_PARAM);
  return value === CART_OPEN_SEARCH_VALUE || value === 'open' || value === 'true';
}

/**
 * Logo / brand link: one level up the storefront hierarchy.
 * product → collection → home; anything else falls back to home.
 */
export function parentNavHref(pathname: string): string {
  if (pathname.startsWith('/products/')) return '/collections';
  if (/^\/collections\/?$/.test(pathname)) return '/';
  return '/';
}
