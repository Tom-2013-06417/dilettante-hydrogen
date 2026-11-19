import {useLoaderData} from 'react-router';
import type {Route} from './+types/discovery-set';
import {Analytics, getSeoMeta} from '@shopify/hydrogen';
import {HERO_STRIP_IMAGE_SRCSET} from '~/components/product/ProductHeroPhoto';
import {DiscoverySetPage} from '~/components/discovery-set';
import {shopifyCdnUrl} from '~/lib/cartLineImage';
import {DEBUT_COLLECTION_HANDLE, pageTitle} from '~/lib/constants';
import {
  DISCOVERY_SET_PRODUCT_ID,
  DISCOVERY_SET_TAGLINE,
  DISCOVERY_SET_TITLE,
  discoverySetVariant,
} from '~/lib/sampleSet';
import {parseScentMetafields} from '~/lib/scentMetafields';
import {parseSecondaryImage} from '~/lib/secondaryImageMetafield';
import {
  seoDescription,
  seoFromMatches,
  seoMediaFromImage,
  twitterImageMeta,
} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) => {
  const image = data?.heroImage ?? data?.sideImage;
  const tags: Route.MetaDescriptors = [
    ...(getSeoMeta(...seoFromMatches(matches)) ?? []),
    ...twitterImageMeta(image?.url),
  ];

  const sideUrl = data?.sideImage?.url;
  if (sideUrl) {
    tags.push({
      tagName: 'link',
      rel: 'preload',
      as: 'image',
      href: shopifyCdnUrl(sideUrl, {
        width: HERO_STRIP_IMAGE_SRCSET.placeholderWidth,
      }),
      fetchpriority: 'high',
    });
  }

  return tags;
};

export async function loader({context, request}: Route.LoaderArgs) {
  const {storefront} = context;

  const [{product}, {collection}] = await Promise.all([
    storefront.query(DISCOVERY_SET_PRODUCT_QUERY, {
      cache: storefront.CacheShort(),
      variables: {id: DISCOVERY_SET_PRODUCT_ID},
    }),
    storefront.query(DISCOVERY_SET_CONTENTS_QUERY, {
      cache: storefront.CacheShort(),
      variables: {handle: DEBUT_COLLECTION_HANDLE},
    }),
  ]);

  if (!product?.id) {
    throw new Response('Discovery Set product not found', {status: 404});
  }
  if (!collection) {
    throw new Response(`Collection ${DEBUT_COLLECTION_HANDLE} not found`, {
      status: 404,
    });
  }

  const selectedVariant = discoverySetVariant(product.variants.nodes);
  const productImage = product.featuredImage?.url
    ? {
        id: product.featuredImage.id ?? 'discovery-set-product',
        url: product.featuredImage.url,
        altText: product.featuredImage.altText || DISCOVERY_SET_TITLE,
        width: product.featuredImage.width,
        height: product.featuredImage.height,
      }
    : null;
  const sideImage = parseSecondaryImage(collection.sampleSetImage);
  const collectionHero = collection.image?.url
    ? {
        id: collection.image.id ?? 'discovery-set-hero',
        url: collection.image.url,
        altText: collection.image.altText || DISCOVERY_SET_TITLE,
        width: collection.image.width,
        height: collection.image.height,
      }
    : null;
  const heroImage = productImage ?? collectionHero ?? sideImage;

  const items = [...collection.products.nodes]
    .map((node) => {
      const parsed = parseScentMetafields({
        scentNumber: node.scentNumber ?? null,
        concentration: null,
        scentTagline: null,
        scentShortDescription: null,
        heroNotes: null,
        topNotes: null,
        heartNotes: null,
        baseNotes: null,
        ingredientList: null,
        olfactoryFamily: node.olfactoryFamily ?? null,
        occasion: null,
        season: null,
      });
      return {
        number: parsed.number ?? '',
        title: node.title,
        notes: parsed.olfactoryFamily ?? [],
      };
    })
    .filter((item) => item.number)
    .sort((a, b) => a.number.localeCompare(b.number));

  const origin = new URL(request.url).origin;
  const shareImage = heroImage ?? sideImage;

  return {
    product,
    selectedVariant,
    heroImage,
    sideImage,
    items,
    seo: {
      title: pageTitle(product.seo?.title || product.title || DISCOVERY_SET_TITLE),
      description: seoDescription(
        product.seo?.description || product.description || DISCOVERY_SET_TAGLINE,
      ),
      url: `${origin}/discovery-set`,
      media: seoMediaFromImage(
        shareImage
          ? {
              url: shareImage.url,
              width: shareImage.width,
              height: shareImage.height,
              altText: shareImage.altText || DISCOVERY_SET_TITLE,
            }
          : null,
      ),
    },
  };
}

export default function DiscoverySet() {
  const {product, selectedVariant, heroImage, sideImage, items} =
    useLoaderData<typeof loader>();

  return (
    <>
      <DiscoverySetPage
        heroImage={heroImage}
        sideImage={sideImage}
        items={items}
        selectedVariant={selectedVariant}
      />
      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </>
  );
}

const DISCOVERY_SET_VARIANT_FRAGMENT = `#graphql
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

const DISCOVERY_SET_PRODUCT_QUERY = `#graphql
  query DiscoverySetProduct(
    $country: CountryCode
    $id: ID!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product: node(id: $id) {
      ... on Product {
        id
        handle
        title
        description
        vendor
        featuredImage {
          id
          url
          altText
          width
          height
        }
        seo {
          title
          description
        }
        variants(first: 20) {
          nodes {
            ...DiscoverySetVariant
          }
        }
      }
    }
  }
  ${DISCOVERY_SET_VARIANT_FRAGMENT}
` as const;

const DISCOVERY_SET_CONTENTS_QUERY = `#graphql
  query DiscoverySetContents(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      image {
        id
        url
        altText
        width
        height
      }
      sampleSetImage: metafield(namespace: "custom", key: "sample_set_image") {
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
      products(first: 10) {
        nodes {
          id
          handle
          title
          scentNumber: metafield(namespace: "custom", key: "scent_number") {
            type
            value
          }
          olfactoryFamily: metafield(namespace: "custom", key: "olfactory_family") {
            type
            value
          }
        }
      }
    }
  }
` as const;
