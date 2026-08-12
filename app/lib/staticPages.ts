/**
 * Hand-authored static pages. Most are plain routes with local copy. Contact
 * and Refund Policy load their bodies from Shopify Admin → Settings → Policies.
 */
/** Inline link inside an FAQ answer paragraph. */
export type FaqAnswerLink = {
  text: string;
  to: string;
};

/**
 * One FAQ answer paragraph: plain text, or an ordered mix of strings and
 * links (rendered inline).
 */
export type FaqAnswerParagraph = string | Array<string | FaqAnswerLink>;

export type FaqItem = {
  question: string;
  /** One entry per paragraph. */
  answer: FaqAnswerParagraph[];
};

export type StaticPage = {
  /** Route path, also the key used to look the page up. */
  path: string;
  /** Mono heading rendered on the page. */
  title: string;
  /** Label used in the footer link list. */
  navLabel: string;
  paragraphs: string[];
};

const PLACEHOLDER = 'Copy for this page has not been written yet.';

export const STATIC_PAGES: StaticPage[] = [
  {
    // Body comes from FAQ_ITEMS below — the route renders an accordion, not prose.
    path: '/faq',
    title: 'FAQ',
    navLabel: 'FAQ',
    paragraphs: [],
  },
  {
    // Body comes from Shopify Admin → Settings → Policies → Contact information.
    path: '/contact',
    title: 'Contact',
    navLabel: 'Contact',
    paragraphs: [],
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy',
    navLabel: 'Privacy Policy',
    paragraphs: [PLACEHOLDER],
  },
  {
    // Body comes from Shopify Admin → Settings → Policies → Refund policy.
    path: '/returns-and-exchanges',
    title: 'Refund Policy',
    navLabel: 'Refund Policy',
    paragraphs: [],
  },
  {
    path: '/terms-of-service',
    title: 'Terms of Service',
    navLabel: 'Terms of Service',
    paragraphs: [PLACEHOLDER],
  },
  {
    path: '/shipping',
    title: 'Shipping',
    navLabel: 'Shipping',
    paragraphs: [PLACEHOLDER],
  },
  {
    path: '/returns-and-cancellation',
    title: 'Returns and Cancellation',
    navLabel: 'Returns and Cancellation',
    paragraphs: [PLACEHOLDER],
  },
];

/**
 * Question-and-answer copy for the /faq accordion. Each `answer` entry is one
 * paragraph.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'How are Dilettante perfumes made?',
    answer: [
      'Our perfumes are composed and made in-house and in small batches by the perfumer, Paulo Pascua.',
    ],
  },
  {
    question: 'Are Dilettante perfumes safe?',
    answer: [
      'All of our perfumes conform to the 51st Amendment of the IFRA (International Fragrance Association) Standards, a set of safety rules setting the maximum usage of materials in fine fragrances. That said, as with all fragrances, there is still a small risk of allergic reactions in some people. Please test on a small patch of skin before wearing.',
      'We also have a list of potential allergens per fragrance in compliance with the EU Cosmetics Regulation. You may find the list on the external packaging of your perfume.',
      'We use sugarcane-extracted deodorized ethanol from BC Fragrances; a safety data sheet (SDS) is available upon request.',
    ],
  },
  {
    question: 'Are Dilettante perfumes all-natural?',
    answer: [
      'No, we use a combination of premium naturals (essential oils, absolutes, extracts, molecular distillations) and synthetic materials. We’ve realized that we tend to use more naturals than the typical perfumer though, hence the longer list of allergens.',
      'Marketing a perfume as “clean” or “all-natural” is misleading at best and fearmongering at worst. “Clean” is a buzzword that can mean anything, and contrary to popular belief, naturals are not inherently safe. We use naturals only at levels established as safe.',
    ],
  },
  {
    question: 'Are Dilettante perfumes vegan?',
    answer: ['Yes. No animal by-product is used in the perfumes.'],
  },
  {
    question: 'Where do you ship?',
    answer: [
      'We only ship within the Philippines right now as we find our footing as a small business. Stay tuned!',
      'For consignment inquiries, please reach out to hello@dilettanteperfumery.com.',
    ],
  },
  {
    question: 'Do you offer refills?',
    answer: [
      'We don’t, but if you wish to order a new bottle without the packaging, please reach out to us.',
    ],
  },
  {
    question: 'What is your policy on refunds, returns, and exchanges',
    answer: [
      [
        'Please refer to our ',
        {text: 'Refund Policy', to: '/returns-and-exchanges'},
        ' for more information.',
      ],
    ],
  },
  {
    question: 'How are orders shipped?',
    answer: [
      'Local orders ship via J&T by default, though we can use other local couriers on request. Orders are fulfilled within 2–3 business days from ordering, except for those made during launch week, which will be fulfilled Aug 15th onwards.',
    ],
  },
];

/** Body copy for /about, in order. First person — this is Paulo's page. */
export const ABOUT_PARAGRAPHS = [
  'My name is Paulo, the founder and perfumer of Dilettante Perfumery.',
  'I’ve been working in corporate/tech for the past decade, and I’m so happy I found perfumery as a creative outlet. I’ve spent the past couple of years pouring all my pent-up creative energy into making wearable art. I even got a Level 2 Certification from the Asian Perfumery Foundation!',
  'I created Dilettante as a reminder to myself to embrace the joy and hard work of making art—to relish being a dilettante.',
  'While Dilettante is a very personal project of mine, it would also not be possible without the help of my friends. The best art, really, is born of community. Thank you to these wonderful artists, and go work with them: they rock!',
];

/** Credits list rendered under the closing paragraph of /about. */
export const ABOUT_CREDITS = [
  'Lazir Caluya, brand designer, packaging designer, and social media',
  'Diego Dimaano, website designer, personality hire, everywoman',
  'Tom Lopez, website developer, Shopify savant, tagaluto ng pancit canton',
  'Denise Fernandez-Panopio, writer, cat lady, fragrance fiend',
  'Bimpoman, photographer, and Gerald del Pilar for connecting us',
  'And finally: Ansis Sy, operations manager, beta tester, moral support, love of my life; and Nico, Gio, Nica, and Wigo, our four cats, welcome distractions',
];

/**
 * Every path that renders the static template, including the standalone About
 * page at /about. PageLayout uses this to decide which routes draw their own
 * HeaderBar and get the `main--static` treatment.
 */
export const STATIC_PAGE_PATHS = new Set([
  '/about',
  ...STATIC_PAGES.map((page) => page.path),
]);

export function getStaticPage(path: string): StaticPage {
  const page = STATIC_PAGES.find((candidate) => candidate.path === path);
  if (!page) throw new Error(`Unknown static page: ${path}`);
  return page;
}
