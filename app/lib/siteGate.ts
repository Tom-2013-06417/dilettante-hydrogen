import type {HydrogenSession} from '@shopify/hydrogen';

export const SITE_UNLOCK_SESSION_KEY = 'siteUnlocked';

/** Plain cookie you can set in DevTools to preview the full site while gated. */
export const SITE_PREVIEW_COOKIE = 'site_preview';

/** True when the full storefront should be public. */
export function isSiteLaunched(env: Env): boolean {
  const value = env.PUBLIC_SITE_LAUNCHED?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

/** Preview unlock via session cookie (after posting the preview token). */
export function isSiteUnlocked(session: HydrogenSession): boolean {
  return session.get(SITE_UNLOCK_SESSION_KEY) === 'true';
}

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    if (rawKey?.trim() !== name) continue;
    try {
      return decodeURIComponent(rest.join('=').trim());
    } catch {
      return rest.join('=').trim();
    }
  }
  return null;
}

/** Shared secret for the site_preview cookie. Not Shopify storefront password. */
export function getPreviewToken(env: Env): string | null {
  const token =
    env.SITE_PREVIEW_TOKEN?.trim() || env.SITE_PREVIEW_PASSWORD?.trim();
  return token || null;
}

/**
 * Preview unlock via a cookie whose value matches SITE_PREVIEW_TOKEN.
 * Example (DevTools): document.cookie = "site_preview=YOUR_TOKEN; path=/"
 */
export function isSiteUnlockedByPreviewCookie(
  env: Env,
  request: Request,
): boolean {
  const expected = getPreviewToken(env);
  if (!expected) return false;
  return (
    readCookie(request.headers.get('Cookie'), SITE_PREVIEW_COOKIE) === expected
  );
}

/** Gate is active: visitors only see the teaser. */
export function isSiteGated(
  env: Env,
  session: HydrogenSession,
  request: Request,
): boolean {
  if (isSiteLaunched(env)) return false;
  if (isSiteUnlocked(session)) return false;
  if (isSiteUnlockedByPreviewCookie(env, request)) return false;
  return true;
}

export function unlockSite(session: HydrogenSession): void {
  session.set(SITE_UNLOCK_SESSION_KEY, 'true');
}

export function verifyPreviewToken(env: Env, value: string): boolean {
  const expected = getPreviewToken(env);
  if (!expected) return false;
  return value === expected;
}

/** @deprecated Use verifyPreviewToken */
export function verifyPreviewPassword(env: Env, password: string): boolean {
  return verifyPreviewToken(env, password);
}
