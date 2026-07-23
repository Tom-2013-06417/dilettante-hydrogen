/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env extends HydrogenEnv {
    /**
     * When "true" / "1" / "yes", the full storefront is public.
     * When unset or false, visitors only see the teaser until they unlock.
     */
    PUBLIC_SITE_LAUNCHED?: string;
    /** Password that unlocks the full site while PUBLIC_SITE_LAUNCHED is false. */
    SITE_PREVIEW_PASSWORD?: string;
    /**
     * Dev Dashboard app credentials (client_credentials → Admin API token).
     * https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens
     * Scopes: read_customers, write_customers. App must be installed on the shop.
     */
    SHOPIFY_APP_CLIENT_ID?: string;
    SHOPIFY_APP_CLIENT_SECRET?: string;
    /**
     * Optional legacy static Admin API token (older custom apps).
     * Prefer SHOPIFY_APP_CLIENT_ID / SHOPIFY_APP_CLIENT_SECRET.
     */
    SHOPIFY_ADMIN_API_ACCESS_TOKEN?: string;
    PRIVATE_ADMIN_API_ACCESS_TOKEN?: string;
  }
}
