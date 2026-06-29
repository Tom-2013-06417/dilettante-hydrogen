export const SITE_TITLE = 'Dilettante';

export function pageTitle(...parts: Array<string | undefined | null>) {
  const suffix = parts.filter(Boolean).join(' | ');
  return suffix ? `${SITE_TITLE} | ${suffix}` : SITE_TITLE;
}
