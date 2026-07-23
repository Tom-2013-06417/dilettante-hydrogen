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
  }
}
