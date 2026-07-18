import {Link} from 'react-router';
import wordmarkInkwell from '~/assets/design/wordmark-inkwell.png';
import {CartIcon} from '~/components/icons/CartIcon';
import {useAside} from '~/components/layout';
import {PageContainer} from '~/components/shared';

export function HeaderBar({
  className = '',
  showLeftRule = true,
}: {
  className?: string;
  /** Set false when a parent draws a continuous left rule past the header. */
  showLeftRule?: boolean;
}) {
  const {open} = useAside();

  return (
    <header
      className={`relative flex w-full flex-none flex-col bg-vellum-100 text-inkwell-700 ${className}`}
    >
      <div className="blueprint-rule-h pointer-events-none absolute inset-x-0 top-2 text-inkwell-700/35 sm:top-4" />
      <div className="blueprint-rule-h pointer-events-none absolute inset-x-0 bottom-0 text-inkwell-700/35" />
      <PageContainer className="relative flex items-stretch">
        <div className="relative flex items-center px-2 pb-2 pt-4 sm:px-4 sm:pb-5 sm:pt-8">
          {showLeftRule ? (
            <div className="blueprint-rule-v pointer-events-none absolute inset-y-0 left-0 text-inkwell-700/35" />
          ) : null}
          <div className="blueprint-rule-v pointer-events-none absolute inset-y-0 right-0 text-inkwell-700/35" />
          <Link to="/" prefetch="intent">
            <img
              className="h-6 w-auto sm:h-9"
              src={wordmarkInkwell}
              alt="Dilettante"
            />
          </Link>
        </div>
        <div className="relative ml-auto flex items-center px-2 pb-2 pt-4 sm:hidden">
          <button
            type="button"
            className="reset relative flex h-6 w-6 cursor-pointer items-center justify-center text-inkwell-700 before:absolute before:-inset-2 before:content-['']"
            aria-label="Open cart"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              open('cart');
            }}
          >
            <CartIcon className="relative h-5 w-5" />
          </button>
        </div>
      </PageContainer>
    </header>
  );
}
