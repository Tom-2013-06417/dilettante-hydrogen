import {Await, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {Aside} from './Aside';
import {PageTransition} from './PageTransition';
import {Header, HeaderMenu} from './Header';
import {SiteFooter} from './SiteFooter';
import {STATIC_PAGE_PATHS} from '~/lib/staticPages';
import {CartLineFeedbackProvider, CartMain} from '~/components/cart';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {ClientOnly, FirstOrderOfferToast} from '~/components/shared';

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
  // Immersive pages are full-bleed (no site chrome header).
  const isImmersive = isHome || isProduct || isCollection;
  // Home ↔ collection ↔ product share the frozen CSS stack cover.
  const isStackRoute = isHome || isProduct || isCollection;
  // Static pages draw their own HeaderBar, so they opt out of the chrome header —
  // but they still animate in like any other routed page.
  const drawsOwnHeader = isImmersive || isStatic;
  // Home is a single full-viewport hero; the product page ends on the pinned
  // VHS overlay. Neither takes a footer.
  const showFooter = !isHome && !isProduct;

  return (
    <Aside.Provider>
      <CartLineFeedbackProvider>
        <CartAside cart={cart} />
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
                : isCollection
                  ? 'main--collection'
                  : isStatic
                    ? 'main--static'
                    : undefined
          }
        >
          {isStackRoute ? (
            <PageTransition nav="stack">
              {/*
                Header lives inside the frozen/sliding layer so home → collection
                can rise as one cover (navbar included). Collection ↔ product
                still freezes the outgoing paint the same way.
              */}
              {!isHome ? (
                <HeaderBar className="relative z-50 shrink-0 bg-vellum-paper" />
              ) : null}
              {children}
            </PageTransition>
          ) : (
            <PageTransition>{children}</PageTransition>
          )}
        </main>
        {showFooter ? <SiteFooter /> : null}
        <ClientOnly>
          <FirstOrderOfferToast />
        </ClientOnly>
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
