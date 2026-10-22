import {getSeoMeta} from '@shopify/hydrogen';

type SeoInput = Parameters<typeof getSeoMeta>[number];

/** Instagram / X handle used for twitter:site + twitter:creator. */
export const TWITTER_HANDLE = '@dilettante.perfumery';

/** Fallback share image when shop brand logo is unset (absolute URL). */
export function defaultShareImageUrl(origin: string) {
  return `${origin.replace(/\/$/, '')}/android-icon-192x192.png`;
}

/**
 * Clamp meta descriptions. Hydrogen's getSeoMeta warns above ~155 chars;
 * crawlers truncate anyway.
 */
export function seoDescription(
  text: string | null | undefined,
  max = 155,
): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return undefined;
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

type SeoImage = {
  url: string;
  width?: number | null;
  height?: number | null;
  altText?: string | null;
};

/**
 * Build getSeoMeta `media`:
 * - string → `og:image` (what Facebook / Instagram actually read)
 * - object → `og:image:url` + width / height / alt
 */
export function seoMediaFromImage(image?: SeoImage | null) {
  if (!image?.url) return undefined;
  return [
    image.url,
    {
      type: 'image' as const,
      url: image.url,
      width: image.width ?? undefined,
      height: image.height ?? undefined,
      altText: image.altText ?? undefined,
    },
  ];
}

/** Pull `seo` objects from active route matches for getSeoMeta(...). */
export function seoFromMatches(
  matches: Array<{data?: unknown} | undefined>,
): SeoInput[] {
  return matches.map((match) => {
    const data = match?.data as {seo?: SeoInput} | undefined;
    return data?.seo;
  });
}

export function twitterImageMeta(imageUrl?: string | null) {
  if (!imageUrl) return [];
  return [
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:image', content: imageUrl},
  ];
}
