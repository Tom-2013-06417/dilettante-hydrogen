/**
 * Scent profile builder — maps Shopify product metafields into UI-ready data.
 */
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import heroLandscape from '~/assets/design/hero-landscape.jpg';
import {
  parseScentMetafields,
  type ProductScentMetafields,
} from '~/lib/scentMetafields';

export type ScentTierId = 'top' | 'heart' | 'base';

export type ScentTier = {
  id: ScentTierId;
  label: string;
  image: string;
  notes: string[];
};

export type ScentProfile = {
  number: string;
  /** From metafield custom.concentration — e.g. "Eau de Toilette". */
  concentration?: string;
  tagline: string;
  shortDescription: string;
  /** From metafield custom.hero_notes — shown under the short description. */
  heroNotes: string[];
  tiers: [ScentTier, ScentTier, ScentTier];
  detailImage: string;
  ingredientList?: string;
  occasion?: string[];
  /** From metafield custom.olfactory_family — under the tagline. */
  olfactoryFamily?: string[];
  season?: string[];
};

const DETAIL_IMAGE = fig02;
const TOP_TIER_IMAGE = fig01;
const HEART_TIER_IMAGE = fig02;
const BASE_TIER_IMAGE = heroLandscape;

function titleCaseNotes(notes: string[]): string[] {
  return notes.map((note) =>
    note
      .split(' ')
      .map((word) =>
        word.length ? word[0]!.toUpperCase() + word.slice(1) : word,
      )
      .join(' '),
  );
}

export type ScentProductInput = {
  handle: string;
} & Partial<ProductScentMetafields>;

export function getScentProfile(product: ScentProductInput): ScentProfile {
  const parsed = parseScentMetafields({
    scentNumber: product.scentNumber ?? null,
    concentration: product.concentration ?? null,
    scentTagline: product.scentTagline ?? null,
    scentShortDescription: product.scentShortDescription ?? null,
    heroNotes: product.heroNotes ?? null,
    topNotes: product.topNotes ?? null,
    heartNotes: product.heartNotes ?? null,
    baseNotes: product.baseNotes ?? null,
    ingredientList: product.ingredientList ?? null,
    olfactoryFamily: product.olfactoryFamily ?? null,
    occasion: product.occasion ?? null,
    season: product.season ?? null,
  });

  return {
    number: parsed.number ?? '',
    concentration: parsed.concentration,
    tagline: parsed.tagline ?? '',
    shortDescription: parsed.shortDescription ?? '',
    heroNotes: parsed.heroNotes ?? [],
    detailImage: DETAIL_IMAGE,
    ingredientList: parsed.ingredientList,
    occasion: parsed.occasion,
    olfactoryFamily: parsed.olfactoryFamily,
    season: parsed.season,
    tiers: [
      {
        id: 'top',
        label: 'Top',
        image: TOP_TIER_IMAGE,
        notes: titleCaseNotes(parsed.topNotes ?? []),
      },
      {
        id: 'heart',
        label: 'Heart',
        image: HEART_TIER_IMAGE,
        notes: titleCaseNotes(parsed.heartNotes ?? []),
      },
      {
        id: 'base',
        label: 'Base',
        image: BASE_TIER_IMAGE,
        notes: titleCaseNotes(parsed.baseNotes ?? []),
      },
    ],
  };
}
