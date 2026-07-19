/**
 * Scent profile builder — reads placeholder variables from
 * `scent-data.placeholder.txt` until Shopify metafields are wired.
 *
 * Copy source: Dilettante Perfumery Copy Sheet (approved taglines,
 * short descriptions, hero notes, Pau's fragrance notes).
 */
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import heroLandscape from '~/assets/design/hero-landscape.jpg';

export type ScentTierId = 'top' | 'heart' | 'base';

export type ScentTier = {
  id: ScentTierId;
  label: string;
  image: string;
  notes: string[];
};

export type ScentProfile = {
  number: string;
  /** Optional title parenthetical — e.g. "(on the crest of a wave)". */
  titleSubtitle?: string;
  /** Format line under price — e.g. "Eau de Toilette — ℮ 30 ml · 1.01 fl oz". */
  subtitle: string;
  tagline: string;
  shortDescription: string;
  /** From CSV "Hero Notes" — shown under the tagline. */
  heroNotes: string[];
  tiers: [ScentTier, ScentTier, ScentTier];
  detailImage: string;
};

type ScentOfflineData = {
  number: string;
  /** Shopify metafield: custom.scent_title_subtitle */
  titleSubtitle?: string;
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
  'forever-on-the-crest-of-a-wave': {
    number: '04',
    titleSubtitle: '(on the crest of a wave)',
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

export function getScentProfile(handle = DEFAULT_HANDLE): ScentProfile {
  const data = SCENT_BY_HANDLE[handle] ?? SCENT_BY_HANDLE[DEFAULT_HANDLE]!;

  return {
    number: data.number,
    titleSubtitle: data.titleSubtitle,
    subtitle: SCENT_SUBTITLE,
    tagline: data.tagline,
    shortDescription: data.shortDescription,
    heroNotes: data.heroNotes,
    detailImage: DETAIL_IMAGE,
    tiers: [
      {
        id: 'top',
        label: 'Top',
        image: TOP_TIER_IMAGE,
        notes: data.topNotes,
      },
      {
        id: 'heart',
        label: 'Heart',
        image: HEART_TIER_IMAGE,
        notes: data.heartNotes,
      },
      {
        id: 'base',
        label: 'Base',
        image: BASE_TIER_IMAGE,
        notes: data.baseNotes,
      },
    ],
  };
}
