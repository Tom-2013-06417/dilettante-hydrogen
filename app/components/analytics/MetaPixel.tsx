import {useEffect} from 'react';
import {
  AnalyticsEvent,
  type CartLineUpdatePayload,
  type CollectionViewPayload,
  type PageViewPayload,
  type ProductViewPayload,
  useAnalytics,
} from '@shopify/hydrogen';
import {
  createMetaEventId,
  gidToMetaContentId,
  loadMetaPixel,
  trackMetaPixel,
} from '~/lib/metaPixel';

type MetaPixelProps = {
  pixelId: string;
};

function currencyFromShop(currency?: string): string {
  return currency ?? 'USD';
}

function trackPageView(payload: PageViewPayload, currency: string) {
  trackMetaPixel(
    'PageView',
    {
      currency,
    },
    createMetaEventId('page_view'),
  );
}

function trackProductView(payload: ProductViewPayload, currency: string) {
  const product = payload.products?.[0];
  if (!product) return;

  const contentId = gidToMetaContentId(product.variantId ?? product.id);
  if (!contentId) return;

  trackMetaPixel(
    'ViewContent',
    {
      content_ids: [contentId],
      content_type: 'product',
      content_name: product.title,
      value: Number.parseFloat(product.price) || 0,
      currency,
    },
    createMetaEventId('view_content'),
  );
}

function trackCollectionView(payload: CollectionViewPayload, currency: string) {
  const contentId = gidToMetaContentId(payload.collection?.id);
  if (!contentId) return;

  trackMetaPixel(
    'ViewContent',
    {
      content_ids: [contentId],
      content_type: 'product_group',
      content_name: payload.collection.handle,
      currency,
    },
    createMetaEventId('view_collection'),
  );
}

function trackAddToCart(payload: CartLineUpdatePayload, currency: string) {
  const line = payload.currentLine;
  const merchandise = line?.merchandise;
  if (!merchandise || !('product' in merchandise)) return;

  const contentId = gidToMetaContentId(merchandise.id);
  if (!contentId) return;

  const addedQty =
    line.quantity - (payload.prevLine?.quantity ?? 0) || line.quantity;
  const unitPrice = Number.parseFloat(merchandise.price?.amount ?? '0') || 0;

  trackMetaPixel(
    'AddToCart',
    {
      content_ids: [contentId],
      content_type: 'product',
      content_name: merchandise.product.title,
      value: unitPrice * addedQty,
      currency: merchandise.price?.currencyCode ?? currency,
      num_items: addedQty,
    },
    createMetaEventId('add_to_cart'),
  );
}

/**
 * Loads Meta Pixel and maps Hydrogen analytics events to standard Meta events.
 * Checkout Purchase events continue to come from Shopify's checkout integration.
 */
export function MetaPixel({pixelId}: MetaPixelProps) {
  const {subscribe, canTrack, shop} = useAnalytics();

  useEffect(() => {
    if (!pixelId) return;

    const currency = currencyFromShop(shop?.currency);

    const guard =
      <T,>(handler: (payload: T) => void) =>
      (payload: T) => {
        if (!canTrack()) return;
        loadMetaPixel(pixelId)
          .then(() => handler(payload))
          .catch((error) => {
            console.error('[meta-pixel] failed to load', error);
          });
      };

    subscribe(
      AnalyticsEvent.PAGE_VIEWED,
      guard<PageViewPayload>((payload) => trackPageView(payload, currency)),
    );
    subscribe(
      AnalyticsEvent.PRODUCT_VIEWED,
      guard<ProductViewPayload>((payload) =>
        trackProductView(payload, currency),
      ),
    );
    subscribe(
      AnalyticsEvent.COLLECTION_VIEWED,
      guard<CollectionViewPayload>((payload) =>
        trackCollectionView(payload, currency),
      ),
    );
    subscribe(
      AnalyticsEvent.PRODUCT_ADD_TO_CART,
      guard<CartLineUpdatePayload>((payload) =>
        trackAddToCart(payload, currency),
      ),
    );
  }, [pixelId, subscribe, canTrack, shop?.currency]);

  return null;
}
