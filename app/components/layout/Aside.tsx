import {ShoppingBagIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {ClientOnly} from '~/components/shared';

type AsideType = 'search' | 'cart' | 'mobile' | 'closed';
type AsideContextValue = {
  type: AsideType;
  open: (mode: AsideType) => void;
  close: () => void;
};

/**
 * A side bar component with Overlay
 * @example
 * ```jsx
 * <Aside type="search" heading="SEARCH">
 *  <input type="search" />
 *  ...
 * </Aside>
 * ```
 */
export function Aside({
  children,
  heading,
  type,
}: {
  children?: React.ReactNode;
  type: AsideType;
  heading: React.ReactNode;
}) {
  const {type: activeType, close} = useAside();
  const expanded = type === activeType;
  const headingId = `aside-${type}-heading`;
  useEffect(() => {
    const abortController = new AbortController();

    if (expanded) {
      document.addEventListener(
        'keydown',
        function handler(event: KeyboardEvent) {
          if (event.key === 'Escape') {
            close();
          }
        },
        {signal: abortController.signal},
      );
    }
    return () => abortController.abort();
  }, [close, expanded]);

  return (
    <div
      aria-modal
      className={`overlay ${expanded ? 'expanded' : ''}`}
      role="dialog"
      aria-labelledby={headingId}
    >
      <button className="close-outside" onClick={close} />
      <aside className={type === 'cart' ? 'aside-cart' : ''}>
        <header>
          <div className="aside-heading">
            {type === 'cart' ? (
              <ShoppingBagIcon className="h-5 w-5" aria-hidden="true" />
            ) : null}
            <h3 id={headingId} className="text-base">
              {heading}
            </h3>
          </div>
          <button className="close reset" onClick={close} aria-label="Close">
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="aside-panel">
          <ClientOnly>{children}</ClientOnly>
        </div>
      </aside>
    </div>
  );
}

const AsideContext = createContext<AsideContextValue | null>(null);

Aside.Provider = function AsideProvider({children}: {children: ReactNode}) {
  const [type, setType] = useState<AsideType>('closed');

  return (
    <AsideContext.Provider
      value={{
        type,
        open: setType,
        close: () => setType('closed'),
      }}
    >
      {children}
    </AsideContext.Provider>
  );
};

export function useAside() {
  const aside = useContext(AsideContext);
  if (!aside) {
    throw new Error('useAside must be used within an AsideProvider');
  }
  return aside;
}
