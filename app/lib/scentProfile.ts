/**
 * Scent profile builder — prefers Shopify product metafields, falls back to
 * offline copy from `scent-data.placeholder.txt` when a field is missing.
 */
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import heroLandscape from '~/assets/design/hero-landscape.jpg';
import {
  parseScentMetafields,
  type ParsedScentMetafields,
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
  /** Format line under price — e.g. "Eau de Toilette — ℮ 30 ml · 1.01 fl oz". */
  subtitle: string;
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

type ScentOfflineData = {
  number: string;
  tagline: string;
  shortDescription: string;
  heroNotes: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
};

const SCENT_SUBTITLE = 'Eau de Toilette — ℮ 30 ml · 1.01 fl oz';
const DETAIL_IMAGE = fig02;
const TOP_TIER_IMAGE = fig01;
const HEART_TIER_IMAGE = fig02;
const BASE_TIER_IMAGE = heroLandscape;

/** Offline profiles keyed by Shopify product handle. */
const SCENT_BY_HANDLE: Record<string, ScentOfflineData> = {
  'kids-on-the-slope': {
    number: '01',
    tagline: 'For the purest of hearts.',
    shortDescription:
      'The laughter of children echoes through endless fields of citrus trees, as they run wildly with jasmine garlands tangled in their hair. To be young is to be free—our souls at their purest state.',
    heroNotes: ['bergamot', 'jasmine', 'incense'],
    topNotes: ['Bergamot', 'Petitgrain', 'Lemon'],
    heartNotes: ['Jasmine sambac', 'Elemi'],
    baseNotes: ['Incense', 'Vetiver', 'Musk'],
  },
  'summer-cannibals': {
    number: '02',
    tagline: 'Feral lovemaking on a bed of crushed fruit.',
    shortDescription:
      'A forbidden, torrid kiss in the garden, at the height of summer. The pungent flesh of hedonists melts into each other, uncertain where one ends and the other begins.',
    heroNotes: ['foliage', 'mango', 'raspberry', 'lipstick', 'musk'],
    topNotes: ['Foliage', 'Wet earth'],
    heartNotes: ['Mango', 'Raspberry', 'Jasmine', 'Rose'],
    baseNotes: ['Lipstick', 'Skin', 'Musk'],
  },
  'temple-at-dawn': {
    number: '03',
    tagline: 'Sweetness made sacred.',
    shortDescription:
      'Servants of god take respite at the break of dawn, surrounded by the aroma of rich, freshly-brewed coffee. A most sacred morning ritual for those in need of momentary peace.',
    heroNotes: ['coffee', 'incense', 'lilac', 'amber'],
    topNotes: ['Cardamom', 'Lavender'],
    heartNotes: ['Hyssop', 'Coffee', 'Lilac'],
    baseNotes: ['Incense', 'Amber', 'Spikenard', 'Musk'],
  },
  forever: {
    number: '04',
    tagline: "A widow's tears on a withered bouquet.",
    shortDescription:
      'From the aftermath of violent waves come tears and seafoam, sprinkled onto a wedding bouquet. A melancholic, olfactory expression of love found and love lost in the blink of an eye.',
    heroNotes: ['orange blossom', 'sea breeze', 'smoke', 'hay'],
    topNotes: ['Bergamot', 'Sweet orange'],
    heartNotes: ['Orange blossom', 'Neroli', 'Sea breeze', 'Honey'],
    baseNotes: ['Hay', 'Vetiver', 'Smoke', 'Amber', 'Vanilla'],
  },
  'creature-feature': {
    number: '05',
    tagline: 'Who lurks there?',
    shortDescription:
      '"See me," he whispers under tobacco-laced breath. An air of ancient forests and animalic musk looms heavy at three in the morning—is this creature of the night man or monster?',
    heroNotes: ['earth', 'queen of the night', 'tobacco'],
    topNotes: ['Black pepper', 'Pink pepper', 'Rosemary'],
    heartNotes: ['Queen of the night', 'Mimosa', 'Violet leaf'],
    baseNotes: ['Tobacco', 'Spices', 'Cedar', 'Patchouli', 'Musk'],
  },
};

const DEFAULT_HANDLE = 'kids-on-the-slope';

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

function pickNotes(
  fromApi: string[] | undefined,
  fallback: string[],
): string[] {
  if (!fromApi?.length) return fallback;
  // Metafield lists are lowercase; keep offline title-case when using API.
  return titleCaseNotes(fromApi);
}

export type ScentProductInput = {
  handle: string;
} & Partial<ProductScentMetafields>;

export function getScentProfile(
  productOrHandle: ScentProductInput | string = DEFAULT_HANDLE,
): ScentProfile {
  const handle =
    typeof productOrHandle === 'string'
      ? productOrHandle
      : productOrHandle.handle;
  const offline =
    SCENT_BY_HANDLE[handle] ?? SCENT_BY_HANDLE[DEFAULT_HANDLE]!;

  const parsed: ParsedScentMetafields =
    typeof productOrHandle === 'string'
      ? {}
      : parseScentMetafields({
          scentNumber: productOrHandle.scentNumber ?? null,
          scentSubtitle: productOrHandle.scentSubtitle ?? null,
          scentTagline: productOrHandle.scentTagline ?? null,
          scentShortDescription:
            productOrHandle.scentShortDescription ?? null,
          heroNotes: productOrHandle.heroNotes ?? null,
          topNotes: productOrHandle.topNotes ?? null,
          heartNotes: productOrHandle.heartNotes ?? null,
          baseNotes: productOrHandle.baseNotes ?? null,
          ingredientList: productOrHandle.ingredientList ?? null,
          olfactoryFamily: productOrHandle.olfactoryFamily ?? null,
          occasion: productOrHandle.occasion ?? null,
          season: productOrHandle.season ?? null,
        });

  const topNotes = pickNotes(parsed.topNotes, offline.topNotes);
  const heartNotes = pickNotes(parsed.heartNotes, offline.heartNotes);
  const baseNotes = pickNotes(parsed.baseNotes, offline.baseNotes);

  return {
    number: parsed.number ?? offline.number,
    subtitle: parsed.subtitle ?? SCENT_SUBTITLE,
    tagline: parsed.tagline ?? offline.tagline,
    shortDescription: parsed.shortDescription ?? offline.shortDescription,
    heroNotes: parsed.heroNotes?.length
      ? parsed.heroNotes
      : offline.heroNotes,
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
        notes: topNotes,
      },
      {
        id: 'heart',
        label: 'Heart',
        image: HEART_TIER_IMAGE,
        notes: heartNotes,
      },
      {
        id: 'base',
        label: 'Base',
        image: BASE_TIER_IMAGE,
        notes: baseNotes,
      },
    ],
  };
}
