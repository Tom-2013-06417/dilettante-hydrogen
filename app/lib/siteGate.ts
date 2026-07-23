import type {HydrogenSession} from '@shopify/hydrogen';

export const SITE_UNLOCK_SESSION_KEY = 'siteUnlocked';

/** True when the full storefront should be public. */
export function isSiteLaunched(env: Env): boolean {
  const value = env.PUBLIC_SITE_LAUNCHED?.trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

/** Preview unlock via session cookie (after entering SITE_PREVIEW_PASSWORD). */
export function isSiteUnlocked(session: HydrogenSession): boolean {
  return session.get(SITE_UNLOCK_SESSION_KEY) === 'true';
}

/** Gate is active: visitors only see the teaser. */
export function isSiteGated(env: Env, session: HydrogenSession): boolean {
  return !isSiteLaunched(env) && !isSiteUnlocked(session);
}

export function unlockSite(session: HydrogenSession): void {
  session.set(SITE_UNLOCK_SESSION_KEY, 'true');
}

export function verifyPreviewPassword(env: Env, password: string): boolean {
  const expected = env.SITE_PREVIEW_PASSWORD?.trim();
  if (!expected) return false;
  return password === expected;
}
