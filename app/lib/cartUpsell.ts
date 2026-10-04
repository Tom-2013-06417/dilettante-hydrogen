import type {Storefront} from '@shopify/hydrogen';
import type {CartUpsellVariantFragment} from 'storefrontapi.generated';

export type CartUpsellVariant = CartUpsellVariantFragment;

/**
 * The 2 mL variant of each scent, in display order. Hardcoded until the upsell
 * gets smarter sorting; the 30 mL variants are deliberately left out.
 */
export const CART_UPSELL_VARIANT_IDS = [
  'gid://shopify/ProductVariant/44017479549018', // 01 Kids on the Slope
  'gid://shopify/ProductVariant/44017482661978', // 02 Summer Cannibals
  'gid://shopify/ProductVariant/44017509597274', // 03 Temple at Dawn
  'gid://shopify/ProductVariant/44017510580314', // 04 Forever (on the Crest of a Wave)
  'gid://shopify/ProductVariant/44017478631514', // 05 Creature Feature
];

/**
 * Selects the same fields as the CartLine merchandise so a variant can stand in
 * as the optimistic line while its LinesAdd is in flight.
 */
const CART_UPSELL_QUERY = `#graphql
  fragment CartUpsellVariant on ProductVariant {
    id
    availableForSale
    currentlyNotInStock
    compareAtPrice {
      currencyCode
      amount
    }
    price {
      currencyCode
      amount
    }
    requiresShipping
    title
    image {
      id
      url
      altText
      width
      height
    }
    product {
      handle
      title
      id
      vendor
      scentNumber: metafield(namespace: "custom", key: "scent_number") {
        value
      }
      preorderEta: metafield(namespace: "custom", key: "preorder_eta") {
        type
        value
      }
    }
    selectedOptions {
      name
      value
    }
  }
  query CartUpsellVariants(
    $country: CountryCode
    $ids: [ID!]!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        ...CartUpsellVariant
      }
    }
  }
` as const;

/**
 * Preorder variants are kept: whether they can be sold depends on the
 * deployment's preorder switch, which the widget checks per render.
 */
export async function loadCartUpsellVariants(
  storefront: Storefront,
): Promise<CartUpsellVariant[]> {
  try {
    const {nodes} = await storefront.query(CART_UPSELL_QUERY, {
      cache: storefront.CacheLong(),
      variables: {ids: CART_UPSELL_VARIANT_IDS},
    });

    return nodes.filter((node): node is CartUpsellVariant =>
      Boolean(node && 'id' in node && node.availableForSale),
    );
  } catch (error) {
    console.error(error);
    return [];
  }
}
