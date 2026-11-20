import {useLoaderData, useSearchParams} from 'react-router';
import type {Route} from './+types/collections._index';
import {
  getPaginationVariables,
  Analytics,
  getSeoMeta,
} from '@shopify/hydrogen';
import {CollectionPage} from '~/components/collections';
import {DEBUT_COLLECTION_HANDLE, pageTitle} from '~/lib/constants';
import {
  DISCOVERY_SET_PRODUCT_ID,
  DISCOVERY_SET_TITLE,
  discoverySetVariant,
} from '~/lib/sampleSet';
import {parseSecondaryImage} from '~/lib/secondaryImageMetafield';
import {
  seoDescription,
  seoFromMatches,
  seoMediaFromImage,
  twitterImageMeta,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches, location}) => {
  const sampleHighlight =
    new URLSearchParams(location.search).get('sample_highlight') === 't';
  const discoveryImage = data?.discoverySetImage;
  const shareImageUrl = sampleHighlight
    ? discoveryImage?.url
    : collectionShareImage(data?.collection)?.url;

  // Shared as /collections?sample_highlight=t — swap in the Discovery Set card image.
  const highlightSeo =
    sampleHighlight && discoveryImage
      ? {
          title: pageTitle(DISCOVERY_SET_TITLE),
          media: seoMediaFromImage({
            url: discoveryImage.url,
            width: discoveryImage.width,
            height: discoveryImage.height,
            altText: discoveryImage.altText || DISCOVERY_SET_TITLE,
          }),
        }
      : undefined;

  return [
    ...(getSeoMeta(...seoFromMatches(matches), highlightSeo) ?? []),
    ...twitterImageMeta(shareImageUrl),
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });

  const [{collection}, {product: discoverySet}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle: DEBUT_COLLECTION_HANDLE, ...paginationVariables},
    }),
    storefront.query(COLLECTION_DISCOVERY_SET_QUERY, {
      cache: storefront.CacheShort(),
      variables: {id: DISCOVERY_SET_PRODUCT_ID},
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${DEBUT_COLLECTION_HANDLE} not found`, {
      status: 404,
    });
  }

  const origin = new URL(request.url).origin;
  const shareImage = collectionShareImage(collection);
  const secondaryImage = parseSecondaryImage(discoverySet?.secondaryImage);
  const featuredImage = discoverySet?.featuredImage?.url
    ? {
        id: discoverySet.featuredImage.id,
        url: discoverySet.featuredImage.url,
        altText: discoverySet.featuredImage.altText || DISCOVERY_SET_TITLE,
        width: discoverySet.featuredImage.width,
        height: discoverySet.featuredImage.height,
      }
    : null;
  // Collection card prefers the product secondary image (same as /discovery-set strip).
  const discoverySetImage = secondaryImage
    ? {
        id: secondaryImage.id,
        url: secondaryImage.url,
        altText: secondaryImage.altText || DISCOVERY_SET_TITLE,
        width: secondaryImage.width,
        height: secondaryImage.height,
      }
    : featuredImage;
  const selectedDiscoveryVariant = discoverySet?.variants?.nodes
    ? discoverySetVariant(discoverySet.variants.nodes)
    : null;

  return {
    collection,
    discoverySetImage,
    discoverySetVariant: selectedDiscoveryVariant,
    seo: {
      title: pageTitle(collection.title),
      description: seoDescription(collection.description),
      url: `${origin}/collections`,
      // Prefer a real product/collection photo over the root brand logo.
      media: seoMediaFromImage(shareImage),
    },
  };
}

/** Plain /collections share art — not the inkwell logo from root SEO. */
function collectionShareImage(
  collection:
    | {
        title?: string | null;
        image?: {
          url?: string | null;
          altText?: string | null;
          width?: number | null;
          height?: number | null;
        } | null;
        products?: {
          nodes?: Array<{
            featuredImage?: {
              url?: string | null;
              altText?: string | null;
              width?: number | null;
              height?: number | null;
            } | null;
          }>;
        };
      }
    | null
    | undefined,
) {
  const image = collection?.image ?? collection?.products?.nodes?.[0]?.featuredImage;
  if (!image?.url) return null;
  return {
    url: image.url,
    width: image.width,
    height: image.height,
    altText: image.altText || collection?.title || undefined,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData(_args: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collection, discoverySetImage, discoverySetVariant} =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const sampleHighlight = searchParams.get('sample_highlight') === 't';

  return (
    <>
      <CollectionPage
        collection={collection}
        discoverySetImage={discoverySetImage}
        discoverySetVariant={discoverySetVariant}
        sampleHighlight={sampleHighlight}
      />
      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </>
  );
}

const COLLECTION_PRODUCT_FRAGMENT = `#graphql
  fragment CollectionProduct on Product {
    id
    handle
    title
    featuredImage {
      id
      altText
      url
      width
      height
    }
    scentNumber: metafield(namespace: "custom", key: "scent_number") {
      type
      value
    }
    scentTagline: metafield(namespace: "custom", key: "scent_tagline") {
      type
      value
    }
  }
` as const;

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/collection
const COLLECTION_QUERY = `#graphql
  ${COLLECTION_PRODUCT_FRAGMENT}
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        id
        url
        altText
        width
        height
      }
      launchDate: metafield(namespace: "custom", key: "launch_date") {
        type
        value
      }
      tagline: metafield(namespace: "custom", key: "tagline") {
        type
        value
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...CollectionProduct
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
` as const;

const COLLECTION_DISCOVERY_SET_VARIANT_FRAGMENT = `#graphql
  fragment DiscoverySetVariant on ProductVariant {
    id
    title
    availableForSale
    currentlyNotInStock
    requiresShipping
    compareAtPrice {
      amount
      currencyCode
    }
    price {
      amount
      currencyCode
    }
    image {
      id
      url
      altText
      width
      height
    }
    selectedOptions {
      name
      value
    }
    product {
      id
      handle
      title
      vendor
    }
  }
` as const;

const COLLECTION_DISCOVERY_SET_QUERY = `#graphql
  query CollectionDiscoverySet(
    $country: CountryCode
    $id: ID!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product: node(id: $id) {
      ... on Product {
        id
        featuredImage {
          id
          url
          altText
          width
          height
        }
        secondaryImage: metafield(namespace: "custom", key: "secondary_image") {
          type
          reference {
            ... on MediaImage {
              id
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
        variants(first: 20) {
          nodes {
            ...DiscoverySetVariant
          }
        }
      }
    }
  }
  ${COLLECTION_DISCOVERY_SET_VARIANT_FRAGMENT}
` as const;
