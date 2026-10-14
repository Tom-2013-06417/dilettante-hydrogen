import {PageContainer} from '~/components/shared';
import {parseCollectionMetafields} from '~/lib/collectionMetafields';
import {
  parseSecondaryImage,
  type StorefrontSecondaryImageMetafield,
} from '~/lib/secondaryImageMetafield';
import {CollectionHeader} from './CollectionHeader';
import {
  CollectionProductCard,
  type CollectionProductCardProduct,
} from './CollectionProductCard';
import {CollectionSampleSetCard} from './CollectionSampleSetCard';

export type CollectionPageCollection = {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  launchDate?: {type: string; value?: string | null} | null;
  tagline?: {type: string; value?: string | null} | null;
  sampleSetImage?: StorefrontSecondaryImageMetafield;
  products: {
    nodes: CollectionProductCardProduct[];
  };
};

type CollectionPageProps = {
  collection: CollectionPageCollection;
  sampleHighlight?: boolean;
};

export function CollectionPage({
  collection,
  sampleHighlight = false,
}: CollectionPageProps) {
  const meta = parseCollectionMetafields({
    launchDate: collection.launchDate ?? null,
    tagline: collection.tagline ?? null,
  });
  const tagline = meta.tagline || collection.description?.trim() || undefined;
  const products = collection.products.nodes;
  const productOffset = sampleHighlight ? 1 : 0;

  const sampleSetItem = (
    <li>
      <CollectionSampleSetCard
        image={parseSecondaryImage(collection.sampleSetImage)}
        loading={sampleHighlight || products.length < 4 ? 'eager' : 'lazy'}
      />
    </li>
  );

  return (
    <article className="collection-page relative min-h-full w-full text-inkwell-700">
      <PageContainer className="relative z-30 pb-16 sm:pb-24">
        <CollectionHeader
          title={collection.title}
          launchDateLabel={meta.launchDateLabel}
          tagline={tagline}
        />

        <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:gap-2">
          {sampleHighlight && sampleSetItem}
          {products.map((product, index) => (
            <li key={product.id}>
              <CollectionProductCard
                product={product}
                loading={index + productOffset < 4 ? 'eager' : 'lazy'}
              />
            </li>
          ))}
          {!sampleHighlight && sampleSetItem}
        </ul>
      </PageContainer>
    </article>
  );
}
