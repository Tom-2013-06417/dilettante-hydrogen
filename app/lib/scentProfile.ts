/**
 * Scent profile builder — reads placeholder variables from
 * `scent-data.placeholder.txt` until Shopify metafields are wired.
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
  tiers: [ScentTier, ScentTier, ScentTier];
  detailImage: string;
};

// Mirrors scent-data.placeholder.txt
const SCENT_NUMBER = '01';
const SCENT_SUBTITLE = 'Eau de Toilette — ℮ 30 ml · 1.01 fl oz';
const DETAIL_IMAGE = fig02;
const TOP_TIER_IMAGE = fig01;
const HEART_TIER_IMAGE = fig02;
const BASE_TIER_IMAGE = heroLandscape;

const TOP_NOTE_POOL = [
  'Bergamot',
  'Neroli',
  'Pink pepper',
  'Grapefruit',
  'Mandarin',
  'Petitgrain',
  'Lemon zest',
  'Green tea',
  'Cardamom',
  'Blackcurrant bud',
];

const HEART_NOTE_POOL = [
  'Jasmine',
  'Orange blossom',
  'Iris',
  'Rose',
  'Lily of the valley',
  'Ylang-ylang',
  'Peony',
  'Osmanthus',
  'Magnolia',
  'Violet leaf',
];

const BASE_NOTE_POOL = [
  'Sandalwood',
  'White musk',
  'Amber',
  'Cedar',
  'Vetiver',
  'Tonka bean',
  'Benzoin',
  'Patchouli',
  'Labdanum',
  'Cashmere wood',
];

function createRng(seed: string) {
  let state = 0;
  for (let i = 0; i < seed.length; i++) {
    state = (state << 5) - state + seed.charCodeAt(i);
    state |= 0;
  }

  return () => {
    state = Math.imul(state ^ (state >>> 16), 0x85ebca6b);
    state = Math.imul(state ^ (state >>> 13), 0xc2b2ae35);
    state ^= state >>> 16;
    return (state >>> 0) / 4294967296;
  };
}

function pickNotes(pool: string[], count: number, rng: () => number) {
  const available = [...pool];
  const picked: string[] = [];

  while (picked.length < count && available.length > 0) {
    const index = Math.floor(rng() * available.length);
    picked.push(available.splice(index, 1)[0]!);
  }

  return picked;
}

export function getScentProfile(handle = 'default'): ScentProfile {
  const rng = createRng(handle);

  return {
    number: SCENT_NUMBER,
    subtitle: SCENT_SUBTITLE,
    detailImage: DETAIL_IMAGE,
    tiers: [
      {
        id: 'top',
        label: 'Top',
        image: TOP_TIER_IMAGE,
        notes: pickNotes(TOP_NOTE_POOL, 3, rng),
      },
      {
        id: 'heart',
        label: 'Heart',
        image: HEART_TIER_IMAGE,
        notes: pickNotes(HEART_NOTE_POOL, 3, rng),
      },
      {
        id: 'base',
        label: 'Base',
        image: BASE_TIER_IMAGE,
        notes: pickNotes(BASE_NOTE_POOL, 3, rng),
      },
    ],
  };
}
