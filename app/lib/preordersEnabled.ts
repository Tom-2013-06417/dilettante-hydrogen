/**
 * Pre-order gating: shop metafield (client toggle) × deployment env (preview vs prod).
 *
 * Shop: custom.preorders_enabled — Settings → Custom data → Shop
 *
 * Oxygen env vars (set differently per deployment):
 *   PUBLIC_DEPLOYMENT=preview   — honor shop toggle (for staging / preview URL)
 *   PUBLIC_DEPLOYMENT=production — requires PUBLIC_PREORDERS_LIVE=true as well
 *
 * Local dev without PUBLIC_DEPLOYMENT behaves like preview.
 */

type BooleanMetafield = {
  type?: string | null;
  value?: string | null;
} | null;

type PurchasableVariant = {
  availableForSale?: boolean | null;
  currentlyNotInStock?: boolean | null;
} | null;

export type Deployment = 'preview' | 'production';

export function parsePreordersEnabledMetafield(
  metafield: BooleanMetafield,
): boolean {
  const value = metafield?.value?.trim().toLowerCase();
  return value === 'true' || value === '1';
}

function parseEnvBool(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

export function parseDeployment(env: Env): Deployment | null {
  const value = env.PUBLIC_DEPLOYMENT?.trim().toLowerCase();
  if (value === 'preview' || value === 'production') return value;
  return null;
}

/** Whether this deployment may honor the shop pre-order toggle. */
export function deploymentAllowsPreorders(env: Env): boolean {
  const deployment = parseDeployment(env);
  if (deployment === 'production') {
    return parseEnvBool(env.PUBLIC_PREORDERS_LIVE);
  }
  // preview, or local dev without PUBLIC_DEPLOYMENT
  return true;
}

/**
 * Pre-orders active when the client enabled them in Admin AND this deployment
 * is allowed to show them (preview always; production only when LIVE).
 */
export function isPreordersEnabled(
  shopMetafield: BooleanMetafield,
  env: Env,
): boolean {
  if (!parsePreordersEnabledMetafield(shopMetafield)) return false;
  return deploymentAllowsPreorders(env);
}

/**
 * Blocks checkout on continue-selling variants when pre-orders are not active
 * on this deployment — keeps prod on "Sold out" while Admin allows oversell.
 */
export function isVariantPurchasable(
  variant: PurchasableVariant,
  preordersEnabled: boolean,
): boolean {
  if (!variant?.availableForSale) return false;
  if (variant.currentlyNotInStock && !preordersEnabled) return false;
  return true;
}

/** Safe read from root loader data (gated + ungated union). */
export function preordersEnabledFromRootData(
  rootData: {siteGated?: boolean; preordersEnabled?: boolean} | undefined,
): boolean {
  if (!rootData || rootData.siteGated) return false;
  return rootData.preordersEnabled ?? false;
}
