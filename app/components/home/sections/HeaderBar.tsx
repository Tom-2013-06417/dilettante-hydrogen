import {Suspense} from 'react';
import {ShoppingBagIcon} from '@heroicons/react/24/outline';
import {
  Await,
  Link,
  useAsyncValue,
  useLocation,
  useRouteLoaderData,
} from 'react-router';
import type {RootLoader} from '~/root';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {useCartItemCount} from '~/components/cart';
import {useAside} from '~/components/layout';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {PageContainer} from '~/components/shared';
import {parentNavHref} from '~/lib/constants';
import type {CartApiQueryFragment} from 'storefrontapi.generated';

export function HeaderBar({
  className = '',
  showLeftRule = true,
}: {
  className?: string;
  /** Set false when a parent draws a continuous left rule past the header. */
  showLeftRule?: boolean;
}) {
  const {pathname} = useLocation();
  const logoTo = parentNavHref(pathname);
  const rootData = useRouteLoaderData<RootLoader>('root');
  const cart = rootData && 'cart' in rootData ? rootData.cart : undefined;

  return (
    <header
      className={`relative flex w-full flex-none flex-col text-inkwell-700 ${className}`}
    >
      <BlueprintRule
        orientation="h"
        className="pointer-events-none absolute inset-x-0 top-2 text-inkwell-700/35 sm:top-4"
      />
      <BlueprintRule
        orientation="h"
        className="pointer-events-none absolute inset-x-0 bottom-0 text-inkwell-700/35"
      />
      <PageContainer className="relative flex items-stretch">
        <div className="relative flex items-center px-2 pb-2 pt-4 sm:px-4 sm:pb-5 sm:pt-8">
          {showLeftRule ? (
            <BlueprintRule
              orientation="v"
              className="pointer-events-none absolute inset-y-0 left-0 text-inkwell-700/35"
            />
          ) : null}
          <BlueprintRule
            orientation="v"
            className="pointer-events-none absolute inset-y-0 right-0 text-inkwell-700/35"
          />
          <Link to={logoTo} prefetch="intent">
            <img
              className="h-6 w-auto sm:h-9"
              src={wordmarkInkwell}
              alt="Dilettante"
            />
          </Link>
        </div>
        <div className="relative ml-auto flex items-center px-2 pb-2 pt-4 sm:hidden">
          <CartToggle cart={cart} />
        </div>
      </PageContainer>
    </header>
  );
}

function CartToggle({
  cart,
}: {
  cart: Promise<CartApiQueryFragment | null> | undefined;
}) {
  if (!cart) return <CartBagButton count={0} />;

  return (
    <Suspense fallback={<CartBagButton count={0} />}>
      <Await resolve={cart}>
        <CartBagBanner />
      </Await>
    </Suspense>
  );
}

function CartBagBanner() {
  const originalCart = useAsyncValue() as CartApiQueryFragment | null;
  const count = useCartItemCount(originalCart);
  return <CartBagButton count={count} />;
}

function CartBagButton({count}: {count: number}) {
  const {open} = useAside();
  const label =
    count > 0
      ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}`
      : 'Open cart';

  return (
    <button
      type="button"
      className="reset relative flex h-6 w-6 cursor-pointer items-center justify-center text-inkwell-700 before:absolute before:-inset-2 before:content-['']"
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        open('cart');
      }}
    >
      <ShoppingBagIcon className="relative h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span
          className="absolute -right-[4px] -top-[2px] font-['config-mono-vf'] text-[10px] leading-none text-inkwell-700"
          aria-hidden="true"
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
