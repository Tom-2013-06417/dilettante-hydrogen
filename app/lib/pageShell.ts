import {STATIC_PAGE_PATHS} from '~/lib/staticPages';

/**
 * Layout shell for a pathname. Add a kind + PAGE_SHELL entry for new page families.
 */

export type PageKind =
  | 'home'
  | 'product'
  | 'collection'
  | 'static'
  | 'default';

type PageShell = {
  mainClass?: string;
  /** Home ↔ collection ↔ product stack cover. */
  stack: boolean;
  /** HeaderBar inside the stack layer (collection/product). */
  stackHeaderBar: boolean;
  /** Page owns HeaderBar, or is immersive (no global Header). */
  drawsOwnHeader: boolean;
  showFooter: boolean;
};

const PAGE_SHELL: Record<PageKind, PageShell> = {
  home: {
    mainClass: 'main--home',
    stack: true,
    stackHeaderBar: false,
    drawsOwnHeader: true,
    showFooter: false,
  },
  product: {
    mainClass: 'main--product',
    stack: true,
    stackHeaderBar: true,
    drawsOwnHeader: true,
    showFooter: false,
  },
  collection: {
    mainClass: 'main--collection',
    stack: true,
    stackHeaderBar: true,
    drawsOwnHeader: true,
    showFooter: true,
  },
  static: {
    mainClass: 'main--static',
    stack: false,
    stackHeaderBar: false,
    drawsOwnHeader: true,
    showFooter: true,
  },
  default: {
    stack: false,
    stackHeaderBar: false,
    drawsOwnHeader: false,
    showFooter: true,
  },
};

function resolvePageKind(pathname: string): PageKind {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/products/')) return 'product';
  if (/^\/collections\/?$/.test(pathname)) return 'collection';
  if (STATIC_PAGE_PATHS.has(pathname)) return 'static';
  return 'default';
}

export function resolvePageShell(pathname: string): PageShell {
  return PAGE_SHELL[resolvePageKind(pathname)];
}

export function joinClassNames(
  ...parts: Array<string | false | null | undefined>
): string | undefined {
  const value = parts.filter(Boolean).join(' ');
  return value || undefined;
}
