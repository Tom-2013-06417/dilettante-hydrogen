/**
 * Typed Shopify metafields on Shop.
 *
 * Define in Admin → Settings → Custom data → Shop, then enable Storefront API
 * access for each definition:
 * - custom.brand_one_liner (Single line text) → footer “what Dilettante is”
 * - custom.preorders_enabled (Boolean) → see preordersEnabled.ts
 *
 * Fetched via one `metafields(identifiers:)` selection — two aliased
 * `metafield()` fields collide under Hydrogen’s subrequest cache.
 */

export type StorefrontShopMetafield = {
  namespace?: string | null;
  key?: string | null;
  type?: string | null;
  value?: string | null;
} | null;

export type ShopMetafieldsList = ReadonlyArray<StorefrontShopMetafield> | null | undefined;

function metafieldByKey(
  metafields: ShopMetafieldsList,
  key: string,
): StorefrontShopMetafield {
  if (!metafields) return null;
  return (
    metafields.find(
      (field) =>
        field?.namespace === 'custom' && field.key === key && field.value != null,
    ) ?? null
  );
}

export function shopPreordersEnabledMetafield(
  metafields: ShopMetafieldsList,
): StorefrontShopMetafield {
  return metafieldByKey(metafields, 'preorders_enabled');
}

export function shopBrandOneLiner(metafields: ShopMetafieldsList): string | undefined {
  const metafield = metafieldByKey(metafields, 'brand_one_liner');
  const value = metafield?.value?.trim();
  if (!value) return undefined;
  if (metafield?.type && metafield.type !== 'single_line_text_field') {
    return undefined;
  }
  return value;
}
