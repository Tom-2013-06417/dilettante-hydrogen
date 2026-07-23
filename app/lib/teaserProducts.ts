export type TeaserSlide = {
  id: string;
  url: string;
  altText: string;
  width?: number | null;
  height?: number | null;
};

const TEASER_PRODUCTS_QUERY = `#graphql
  query TeaserProducts(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 10) {
      nodes {
        id
        handle
        title
        featuredImage {
          id
          url
          altText
          width
          height
        }
        scentNumber: metafield(namespace: "custom", key: "scent_number") {
          value
        }
      }
    }
  }
` as const;

type TeaserProductsQuery = {
  products: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      featuredImage: {
        id?: string | null;
        url: string;
        altText?: string | null;
        width?: number | null;
        height?: number | null;
      } | null;
      scentNumber: {value?: string | null} | null;
    }>;
  };
};

type TeaserStorefront = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: (query: typeof TEASER_PRODUCTS_QUERY, options?: any) => Promise<TeaserProductsQuery>;
  CacheLong: () => unknown;
};

/** First five catalog products with a main image, ordered by scent number when set. */
export async function loadTeaserSlides(
  storefront: TeaserStorefront,
): Promise<TeaserSlide[]> {
  try {
    const {products} = await storefront.query(TEASER_PRODUCTS_QUERY, {
      cache: storefront.CacheLong(),
    });

    return products.nodes
      .filter((product) => Boolean(product.featuredImage?.url))
      .sort((a, b) => {
        const aNum = Number.parseInt(a.scentNumber?.value ?? '', 10);
        const bNum = Number.parseInt(b.scentNumber?.value ?? '', 10);
        const aSafe = Number.isFinite(aNum) ? aNum : Number.POSITIVE_INFINITY;
        const bSafe = Number.isFinite(bNum) ? bNum : Number.POSITIVE_INFINITY;
        if (aSafe !== bSafe) return aSafe - bSafe;
        return a.title.localeCompare(b.title);
      })
      .slice(0, 5)
      .map((product) => {
        const image = product.featuredImage!;
        return {
          id: product.id,
          url: image.url,
          altText: image.altText || product.title,
          width: image.width,
          height: image.height,
        };
      });
  } catch (error) {
    console.error(error);
    return [];
  }
}
