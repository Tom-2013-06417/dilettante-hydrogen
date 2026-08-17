/**
 * When `true`, dismiss and signup are written to localStorage so the strip
 * stays gone across refreshes. `false` is session-only (useful for preview).
 */
export const FIRST_ORDER_OFFER_PERSIST_DISMISS = true;

/** Portal target on `SiteFooter` for the in-flow (seamless) strip. */
export const FIRST_ORDER_OFFER_FOOTER_SLOT = 'data-first-order-offer-slot';

/**
 * Shared slide motion for both strip copies (floating + footer).
 * Keep in sync with `--first-order-offer-motion-ms` / classes in design.css.
 */
export const FIRST_ORDER_OFFER_MOTION_MS = 350;
export const FIRST_ORDER_OFFER_ENTER_CLASS = 'first-order-offer-enter';
export const FIRST_ORDER_OFFER_EXIT_CLASS = 'first-order-offer-exit';

/** CSS class for the active enter/exit state — same for float and footer dups. */
export function firstOrderOfferMotionClass({
  enter = false,
  exit = false,
}: {
  enter?: boolean;
  exit?: boolean;
}): string {
  if (exit) return FIRST_ORDER_OFFER_EXIT_CLASS;
  if (enter) return FIRST_ORDER_OFFER_ENTER_CLASS;
  return '';
}

/** localStorage keys for the first-order signup offer. */
export const FIRST_ORDER_OFFER_TOAST_DISMISS_KEY =
  'dilettante:first-order-offer:toast-dismissed';
export const FIRST_ORDER_OFFER_SUBSCRIBED_KEY =
  'dilettante:first-order-offer:subscribed';

/** Delay before the strip appears. */
export const FIRST_ORDER_OFFER_TOAST_DELAY_MS = 6_000;

export const FIRST_ORDER_OFFER_COPY = {
  modalTitle: '10% off your first order.',
  modalBody:
    'Join the list and we’ll send a code for your first purchase — plus early word on new releases.',
  cta: 'Join',
  toastLine: 'First order — 10% off when you join the list.',
} as const;

function readFlag(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeFlag(key: string): void {
  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Private mode / blocked storage — state just won't persist.
  }
}

export function hasDismissedFirstOrderToast(): boolean {
  if (!FIRST_ORDER_OFFER_PERSIST_DISMISS) return false;
  return readFlag(FIRST_ORDER_OFFER_TOAST_DISMISS_KEY);
}

export function hasSubscribedFirstOrderOffer(): boolean {
  return readFlag(FIRST_ORDER_OFFER_SUBSCRIBED_KEY);
}

export function dismissFirstOrderToast(): void {
  if (!FIRST_ORDER_OFFER_PERSIST_DISMISS) return;
  writeFlag(FIRST_ORDER_OFFER_TOAST_DISMISS_KEY);
}

export function markFirstOrderOfferSubscribed(): void {
  writeFlag(FIRST_ORDER_OFFER_SUBSCRIBED_KEY);
  if (FIRST_ORDER_OFFER_PERSIST_DISMISS) {
    writeFlag(FIRST_ORDER_OFFER_TOAST_DISMISS_KEY);
  }
}

/** Delayed toast — hide after dismiss or signup. */
export function shouldHideFirstOrderToast(): boolean {
  return hasDismissedFirstOrderToast() || hasSubscribedFirstOrderOffer();
}
