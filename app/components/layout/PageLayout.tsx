import {Await, useLocation} from 'react-router';
import {Suspense} from 'react';
import type {CartApiQueryFragment, HeaderQuery} from 'storefrontapi.generated';
import {Aside} from './Aside';
import {PageTransition} from './PageTransition';
import {Header, HeaderMenu} from './Header';
import {SiteFooter} from './SiteFooter';
import {TopBanner} from './TopBanner';
import {joinClassNames, resolvePageShell} from '~/lib/pageShell';
import {shopAnnouncementTexts, shouldShowTopBanner} from '~/lib/topBanner';
import {CartLineFeedbackProvider, CartMain} from '~/components/cart';
import {HeaderBar} from '~/components/home/sections/HeaderBar';

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
  const {pathname} = useLocation();
  const shell = resolvePageShell(pathname);
  const showTopBanner = shouldShowTopBanner(pathname);

  return (
    <Aside.Provider>
      <CartLineFeedbackProvider>
        <TopBanner
          open={showTopBanner}
          texts={shopAnnouncementTexts(
            header.shop.announcementTexts ?? null,
          )}
        />
        <CartAside cart={cart} />
        <MobileMenuAside
          header={header}
          publicStoreDomain={publicStoreDomain}
        />
        {header && !shell.drawsOwnHeader ? (
          <Header
            header={header}
            cart={cart}
            isLoggedIn={isLoggedIn}
            publicStoreDomain={publicStoreDomain}
          />
        ) : null}
        <main
          className={joinClassNames(
            shell.mainClass,
            showTopBanner && 'has-top-banner',
          )}
        >
          {shell.stack ? (
            <PageTransition nav="stack">
              {/*
                Header lives inside the frozen/sliding layer so home → collection
                can rise as one cover (navbar included).
              */}
              {shell.stackHeaderBar ? (
                <HeaderBar className="relative z-50 shrink-0 bg-vellum-paper" />
              ) : null}
              {children}
            </PageTransition>
          ) : (
            <PageTransition>{children}</PageTransition>
          )}
        </main>
        {shell.showFooter ? <SiteFooter /> : null}
      </CartLineFeedbackProvider>
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
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
