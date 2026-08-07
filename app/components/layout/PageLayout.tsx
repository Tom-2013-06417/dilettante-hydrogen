import {Await, Link, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {Aside} from './Aside';
import {PageTransition} from './PageTransition';
import {Header, HeaderMenu} from './Header';
import {SiteFooter} from './SiteFooter';
import {STATIC_PAGE_PATHS} from '~/lib/staticPages';
import {CartLineFeedbackProvider, CartMain} from '~/components/cart';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
  SearchResultsPredictive,
} from '~/components/search';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  header: HeaderQuery;
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;
}

export function PageLayout({
  cart,
  children = null,
  header,
  isLoggedIn,
  publicStoreDomain,
}: PageLayoutProps) {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isProduct = location.pathname.startsWith('/products/');
  const isCollection = /^\/collections\/?$/.test(location.pathname);
  const isStatic = STATIC_PAGE_PATHS.has(location.pathname);
  // Immersive pages are full-bleed and skip the page transition.
  const isImmersive = isHome || isProduct || isCollection;
  const isStackRoute = isProduct || isCollection;
  // Static pages draw their own HeaderBar, so they opt out of the chrome header —
  // but they still animate in like any other routed page.
  const drawsOwnHeader = isImmersive || isStatic;
  // Home is a JS-driven snap deck of h-svh sections; trailing content would sit
  // outside that scroll logic, so it's the one route without a footer.
  const showFooter = !isHome;

  return (
    <Aside.Provider>
      <CartLineFeedbackProvider>
        <CartAside cart={cart} />
        <SearchAside />
        <MobileMenuAside
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
      {header && !drawsOwnHeader ? (
          <Header
            header={header}
            cart={cart}
            isLoggedIn={isLoggedIn}
            publicStoreDomain={publicStoreDomain}
          />
        ) : null}
        <main
          className={
            isHome
              ? 'main--home'
              : isProduct
                ? 'main--product'
                : isStatic
                  ? 'main--static'
                  : undefined
          }
        >
          {isStackRoute ? (
            <>
              <HeaderBar className="relative z-50 shrink-0 bg-vellum-paper" />
              <PageTransition nav="stack">{children}</PageTransition>
            </>
          ) : isImmersive ? (
            children
          ) : (
            <PageTransition>{children}</PageTransition>
          )}
        </main>
        {showFooter ? <SiteFooter /> : null}
      </CartLineFeedbackProvider>
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = 'predictive-search-queries';
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

function MobileMenuAside({
  header,
  publicStoreDomain,
}: {
  header: PageLayoutProps['header'];
  publicStoreDomain: PageLayoutProps['publicStoreDomain'];
}) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="MENU">
        <HeaderMenu
          menu={header.menu}
          viewport="mobile"
          primaryDomainUrl={header.shop.primaryDomain.url}
          publicStoreDomain={publicStoreDomain}
        />
      </Aside>
    )
  );
}
