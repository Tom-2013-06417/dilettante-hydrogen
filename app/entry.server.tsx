import {ServerRouter} from 'react-router';
import {renderToReadableStream} from 'react-dom/server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type {EntryContext} from 'react-router';

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    styleSrc: [
      'https://fonts.googleapis.com',
      'https://use.typekit.net',
      'https://p.typekit.net',
    ],
    fontSrc: [
      "'self'",
      'https://fonts.gstatic.com',
      'https://use.typekit.net',
      'https://p.typekit.net',
    ],
    // Merged with Hydrogen defaults ('self', monorail, checkout, store domain).
    connectSrc: [
      "'self'",
      'https://use.typekit.net',
      'https://p.typekit.net',
      'https://cdn.shopify.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
      'https://*.myshopify.dev',
    ],
    // Directives Hydrogen does not default — must list every allowed origin.
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://connect.facebook.net',
    ],
    imgSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://shopify.com',
      'https://www.facebook.com',
      'data:',
      'blob:',
    ],
    manifestSrc: ["'self'"],
  });

  const body = await renderToReadableStream(
    <NonceProvider>
      <ServerRouter
        context={reactRouterContext}
        url={request.url}
        nonce={nonce}
      />
    </NonceProvider>,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        console.error(error);
        responseStatusCode = 500;
      },
    },
  );

  await body.allReady;

  responseHeaders.set('Content-Type', 'text/html');
  responseHeaders.set('Content-Security-Policy', header);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
