import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/collections.$handle';
import {getPaginationVariables, Analytics} from '@shopify/hydrogen';
import {CollectionPage} from '~/components/collections';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {pageTitle} from '~/lib/constants';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: pageTitle(data?.collection.title)}];
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
async function loadCriticalData({context, params, request}: Route.LoaderArgs) {
  const {handle} = params;
  const {storefront} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 24,
  });

  if (!handle) {
    throw redirect('/collections');
  }

  const [{collection}] = await Promise.all([
    storefront.query(COLLECTION_QUERY, {
      variables: {handle, ...paginationVariables},
    }),
  ]);

  if (!collection) {
    throw new Response(`Collection ${handle} not found`, {
      status: 404,
    });
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  return {
    collection,
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

export default function Collection() {
  const {collection} = useLoaderData<typeof loader>();

  return (
    <>
      <CollectionPage collection={collection} />
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
