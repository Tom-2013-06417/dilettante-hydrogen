import * as serverBuild from 'virtual:react-router/server-build';
import {createRequestHandler, storefrontRedirect} from '@shopify/hydrogen';
import {createHydrogenRouterContext} from '~/lib/context';
import {isSiteGated} from '~/lib/siteGate';

/** Paths the gated teaser still needs (UI, action, RR/Vite internals). */
function isAllowedWhenGated(pathname: string) {
  if (pathname === '/' || pathname === '/teaser') return true;
  // React Router single-fetch / manifest / Vite HMR
  if (pathname.startsWith('/__')) return true;
  if (pathname.startsWith('/@')) return true;
  if (pathname.endsWith('.data')) return true;
  if (pathname.startsWith('/node_modules/')) return true;
  if (pathname.startsWith('/app/')) return true;
  if (pathname.startsWith('/assets/')) return true;
  return /\.(js|css|map|svg|png|jpe?g|webp|woff2?|ico)$/i.test(pathname);
}

/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      const hydrogenContext = await createHydrogenRouterContext(
        request,
        env,
        executionContext,
      );

      const url = new URL(request.url);
      const gated = isSiteGated(env, hydrogenContext.session);

      // While gated, only the teaser UI + /teaser action (and framework assets)
      // are reachable. Redirect real storefront paths so their loaders never run.
      if (gated && !isAllowedWhenGated(url.pathname)) {
        return new Response(null, {
          status: 302,
          headers: {Location: '/'},
        });
      }

      /**
       * Create a Hydrogen request handler that internally
       * delegates to React Router for routing and rendering.
       */
      const handleRequest = createRequestHandler({
        build: serverBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => hydrogenContext,
      });

      const response = await handleRequest(request);

      if (hydrogenContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await hydrogenContext.session.commit(),
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({
          request,
          response,
          storefront: hydrogenContext.storefront,
        });
      }

      return response;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
