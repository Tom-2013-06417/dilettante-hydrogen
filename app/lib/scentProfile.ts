/**
 * Scent profile builder — reads placeholder variables from
 * `scent-data.placeholder.txt` until Shopify metafields are wired.
 *
 * Copy source: Dilettante Perfumery Copy Sheet (approved taglines,
 * long descriptions, Pau's fragrance notes).
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
  subtitle: string;
  tagline: string;
  description: string;
  /** Temporary: top notes only, until a dedicated summary field exists. */
  summaryNotes: string[];
  tiers: [ScentTier, ScentTier, ScentTier];
  detailImage: string;
};

type ScentOfflineData = {
  number: string;
  tagline: string;
  description: string;
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
    description:
      "Bergamot and lemon cut through the morning air as bare feet race across dew-soaked grass. Things always look bigger when you're a child, playing among towering citrus trees, endless fields, and cascades upon cascades of wild jasmine flowers. Behold—the world, vast and infinite, ours for the taking. Do you remember how it feels to be young?",
    topNotes: ['Bergamot', 'Petitgrain', 'Lemon'],
    heartNotes: ['Jasmine sambac', 'Elemi'],
    baseNotes: ['Incense', 'Vetiver', 'Musk'],
  },
  'summer-cannibals': {
    number: '02',
    tagline: 'Feral lovemaking on a bed of crushed fruit.',
    description:
      'Passions run high when the weather gets warm. Lovers intertwine in a secret garden, skin on skin, moist with sweat as they lie on pulps of mango and raspberry. Roses in full bloom become voyeurs to this forbidden embrace, and each fevered, lipstick-stained kiss grows their appetite for each other. Teeth sink into flesh as they reach ecstasy. We are not in Eden anymore.',
    topNotes: ['Foliage', 'Wet earth'],
    heartNotes: ['Mango', 'Raspberry', 'Jasmine', 'Rose'],
    baseNotes: ['Lipstick', 'Skin', 'Musk'],
  },
  'temple-at-dawn': {
    number: '03',
    tagline: 'Sweetness made sacred.',
    description:
      "Even god's most devoted need a moment of rest. On top of a mountain, they hold their cups close to their chests, greeted by the sweet scent of lilacs dancing in the fields. There is truly nothing like the morning ritual of freshly-brewed coffee, topped with a dash of cinnamon and the slightest pinch of nutmeg. With the dawn comes a cool breeze and a hazy, sunkissed sky. Peace, finally.",
    topNotes: ['Cardamom', 'Lavender'],
    heartNotes: ['Hyssop', 'Coffee', 'Lilac'],
    baseNotes: ['Incense', 'Amber', 'Spikenard', 'Musk'],
  },
  'forever-on-the-crest-of-a-wave': {
    number: '04',
    tagline: "A widow's tears on a withered bouquet.",
    description:
      'William Shakespeare once said, these violent delights have violent ends. Wilted bouquet in hand, an abandoned bride sits on a cliff overlooking turbulent waves. Orange blossom and neroli drift in on a sea breeze, sweet before the sorrow sets in. Giant flames burn furiously, the destruction fresh in her memories. From this great height, she wonders what it would be like, to join her lost lover on the other side.',
    topNotes: ['Bergamot', 'Sweet orange'],
    heartNotes: ['Orange blossom', 'Neroli', 'Sea breeze', 'Honey'],
    baseNotes: ['Hay', 'Vetiver', 'Smoke', 'Amber', 'Vanilla'],
  },
  'creature-feature': {
    number: '05',
    tagline: 'Who lurks there?',
    description:
      'Monsters, so it seems, are mirrors of our deepest desires. This dark seduction takes place in the home of a beast that begs to be tamed. Dense cigar smoke intertwines with soft florals and woods as rain dampens the age-old earth below. The creature beckons, calling out into the night. It is cold in this house, but the promise of his embrace feels warm.',
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
    subtitle: SCENT_SUBTITLE,
    tagline: data.tagline,
    description: data.description,
    summaryNotes: data.topNotes,
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
