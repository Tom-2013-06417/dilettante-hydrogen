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

/**
 * Depth in the collection ↔ product stack (for push/pop transitions).
 * `null` = outside that stack.
 */
export function storefrontStackDepth(pathname: string): number | null {
  if (/^\/collections\/?$/.test(pathname)) return 1;
  if (pathname.startsWith('/products/')) return 2;
  return null;
}

/** Location state set when opening a product from the collection stack. */
export const STACK_ENTER_STATE = {stackEnter: true} as const;

export function isStackEnterState(state: unknown): boolean {
  return (
    !!state &&
    typeof state === 'object' &&
    'stackEnter' in state &&
    (state as {stackEnter?: unknown}).stackEnter === true
  );
}
