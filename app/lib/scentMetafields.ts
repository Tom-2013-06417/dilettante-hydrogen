/**
 * Typed Shopify metafields used for scent product data.
 *
 * Custom fields live in `custom.*`. Category attributes (occasion,
 * olfactory family, season) live in `shopify.*` as metaobject lists.
 */

/** Metafield types observed on Dilettante scent products. */
export type ScentMetafieldType =
  | 'single_line_text_field'
  | 'list.single_line_text_field'
  | 'list.metaobject_reference';

/** Known `custom` namespace product metafield keys. */
export const CUSTOM_SCENT_METAFIELD_KEYS = [
  'scent_number',
  'concentration',
  'scent_tagline',
  'scent_short_description',
  'hero_notes',
  'top_notes',
  'heart_notes',
  'base_notes',
  'ingredient_list',
  'olfactory_family',
  'occasion',
  'season',
] as const;

export type CustomScentMetafieldKey =
  (typeof CUSTOM_SCENT_METAFIELD_KEYS)[number];

/** Known `shopify` namespace category metafield keys. */
export const SHOPIFY_CATEGORY_METAFIELD_KEYS = ['occasion', 'season'] as const;

export type ShopifyCategoryMetafieldKey =
  (typeof SHOPIFY_CATEGORY_METAFIELD_KEYS)[number];

export type TaxonomyMetaobjectField = {
  key: string;
  /** Storefront `MetaobjectField.value` is optional/nullable. */
  value?: string | null;
};

/** Label entry from a Shopify taxonomy metaobject (e.g. shopify--occasion). */
export type TaxonomyMetaobject = {
  handle?: string | null;
  type?: string | null;
  fields?: Array<TaxonomyMetaobjectField> | null;
};

/**
 * Storefront metafield shape returned by aliased `metafield(...)` selections.
 * `references` is only populated for metaobject / list.metaobject_reference.
 * Matches codegen nullability so `ProductFragment` is assignable here.
 */
export type StorefrontScentMetafield = {
  type: string;
  value?: string | null;
  references?: {
    nodes: Array<TaxonomyMetaobject | null>;
  } | null;
} | null;

/**
 * Aliased metafields on the Product GraphQL fragment.
 * Field names match the aliases in `PRODUCT_FRAGMENT`.
 */
export type ProductScentMetafields = {
  scentNumber: StorefrontScentMetafield;
  concentration: StorefrontScentMetafield;
  scentTagline: StorefrontScentMetafield;
  scentShortDescription: StorefrontScentMetafield;
  heroNotes: StorefrontScentMetafield;
  topNotes: StorefrontScentMetafield;
  heartNotes: StorefrontScentMetafield;
  baseNotes: StorefrontScentMetafield;
  ingredientList: StorefrontScentMetafield;
  /** Product metafield: custom.olfactory_family */
  olfactoryFamily: StorefrontScentMetafield;
  occasion: StorefrontScentMetafield;
  season: StorefrontScentMetafield;
};

/** Parsed, app-ready scent fields from metafields (before UI defaults). */
export type ParsedScentMetafields = {
  number?: string;
  concentration?: string;
  tagline?: string;
  shortDescription?: string;
  heroNotes?: string[];
  topNotes?: string[];
  heartNotes?: string[];
  baseNotes?: string[];
  ingredientList?: string;
  occasion?: string[];
  olfactoryFamily?: string[];
  season?: string[];
};

function parseListString(
  value: string | undefined | null,
): string[] | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every((item): item is string => typeof item === 'string')
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return undefined;
}

function taxonomyLabel(node: TaxonomyMetaobject | null): string | undefined {
  if (!node) return undefined;
  const label = node.fields?.find((field) => field.key === 'label')?.value;
  return label || node.handle || undefined;
}

function parseTaxonomyLabels(
  metafield: StorefrontScentMetafield,
): string[] | undefined {
  const labels = metafield?.references?.nodes
    ?.map(taxonomyLabel)
    .filter((label): label is string => Boolean(label));
  return labels?.length ? labels : undefined;
}

function textValue(metafield: StorefrontScentMetafield): string | undefined {
  const value = metafield?.value?.trim();
  return value || undefined;
}

/**
 * Normalize Storefront metafield payloads into plain strings / string lists.
 * Occasion / season come from Shopify category metaobjects; olfactory family
 * uses the custom product metafield.
 */
export function parseScentMetafields(
  fields: ProductScentMetafields,
): ParsedScentMetafields {
  return {
    number: textValue(fields.scentNumber),
    concentration: textValue(fields.concentration),
    tagline: textValue(fields.scentTagline),
    shortDescription: textValue(fields.scentShortDescription),
    heroNotes: parseListString(fields.heroNotes?.value),
    topNotes: parseListString(fields.topNotes?.value),
    heartNotes: parseListString(fields.heartNotes?.value),
    baseNotes: parseListString(fields.baseNotes?.value),
    ingredientList: textValue(fields.ingredientList),
    occasion: parseTaxonomyLabels(fields.occasion),
    olfactoryFamily: parseListString(fields.olfactoryFamily?.value),
    season: parseTaxonomyLabels(fields.season),
  };
}
