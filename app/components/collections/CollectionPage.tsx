import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {PageContainer} from '~/components/shared';
import {parseCollectionMetafields} from '~/lib/collectionMetafields';
import {CollectionHeader} from './CollectionHeader';
import {
  CollectionProductCard,
  type CollectionProductCardProduct,
} from './CollectionProductCard';

export type CollectionPageCollection = {
  id: string;
  handle: string;
  title: string;
  description?: string | null;
  launchDate?: {type: string; value?: string | null} | null;
  tagline?: {type: string; value?: string | null} | null;
  products: {
    nodes: CollectionProductCardProduct[];
  };
};

type CollectionPageProps = {
  collection: CollectionPageCollection;
};

export function CollectionPage({collection}: CollectionPageProps) {
  const meta = parseCollectionMetafields({
    launchDate: collection.launchDate ?? null,
    tagline: collection.tagline ?? null,
  });
  const tagline = meta.tagline || collection.description?.trim() || undefined;

  return (
    <article className="collection-page relative min-h-svh w-full text-inkwell-700">
      <HeaderBar className="bg-vellum-paper" />

      <PageContainer className="relative z-30 pb-16 sm:pb-24">
        <CollectionHeader
          title={collection.title}
          launchDateLabel={meta.launchDateLabel}
          tagline={tagline}
        />

        <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:gap-2">
          {collection.products.nodes.map((product, index) => (
            <li key={product.id}>
              <CollectionProductCard
                product={product}
                loading={index < 4 ? 'eager' : 'lazy'}
              />
            </li>
          ))}
        </ul>
      </PageContainer>
    </article>
  );
}
