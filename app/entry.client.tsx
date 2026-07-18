import {HydratedRouter} from 'react-router/dom';
import {startTransition} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {NonceProvider} from '@shopify/hydrogen';

function getHydrationNonce() {
  return (
    document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
      ?.content ||
    document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ||
    undefined
  );
}

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    hydrateRoot(
      document,
      <NonceProvider value={getHydrationNonce()}>
        <HydratedRouter />
      </NonceProvider>,
    );
  });
}
