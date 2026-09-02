import {parseGid} from '@shopify/hydrogen';

const META_PIXEL_SCRIPT_URL = 'https://connect.facebook.net/en_US/fbevents.js';

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: Fbq;
  loaded: boolean;
  version: string;
};

let loadPromise: Promise<void> | null = null;
let initializedPixelId: string | null = null;

/** Shopify GID → numeric id for Meta catalog matching. */
export function gidToMetaContentId(gid: string | undefined | null): string | null {
  if (!gid) return null;
  try {
    return String(parseGid(gid).id);
  } catch {
    return null;
  }
}

export function createMetaEventId(prefix: string): string {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function ensureFbqStub(): Fbq {
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as Fbq;

  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];

  return fbq;
}

export function loadMetaPixel(pixelId: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  ensureFbqStub();

  if (initializedPixelId === pixelId && window.fbq?.loaded) {
    return loadPromise ?? Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-meta-pixel="true"]',
      );
      if (existing) {
        existing.addEventListener('load', () => resolve(), {once: true});
        existing.addEventListener(
          'error',
          () => reject(new Error('Meta Pixel script failed to load')),
          {once: true},
        );
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = META_PIXEL_SCRIPT_URL;
      script.dataset.metaPixel = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Meta Pixel script failed to load'));
      document.head.appendChild(script);
    });
  }

  return loadPromise.then(() => {
    if (initializedPixelId !== pixelId) {
      window.fbq?.('init', pixelId);
      initializedPixelId = pixelId;
    }
  });
}

export function trackMetaPixel(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): void {
  if (!window.fbq || !initializedPixelId) return;

  if (eventId) {
    window.fbq('track', eventName, params ?? {}, {eventID: eventId});
    return;
  }

  window.fbq('track', eventName, params ?? {});
}

export async function trackMetaInitiateCheckout(
  pixelId: string,
  {
    value,
    currency,
    contentIds,
    numItems,
  }: {
    value: number;
    currency: string;
    contentIds: string[];
    numItems: number;
  },
): Promise<void> {
  await loadMetaPixel(pixelId);
  trackMetaPixel(
    'InitiateCheckout',
    {
      value,
      currency,
      content_ids: contentIds,
      content_type: 'product',
      num_items: numItems,
    },
    createMetaEventId('initiate_checkout'),
  );
}
