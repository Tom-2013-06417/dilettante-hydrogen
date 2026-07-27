import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {BlueprintRule} from '~/components/product/BlueprintRule';
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
      {/*
        Full-page left rule: above the navbar logo (z-20), under the cards
        (cards sit at z-30).
      */}
      <BlueprintRule
        orientation="v"
        className="pointer-events-none absolute inset-y-0 left-4 z-20 text-inkwell-700/35 sm:left-8"
      />

      <HeaderBar className="bg-vellum-100" showLeftRule={false} />

      <PageContainer>
        <CollectionHeader
          title={collection.title}
          launchDateLabel={meta.launchDateLabel}
          tagline={tagline}
        />
      </PageContainer>

      {/*
        Side inset matches the page rule (left-4 / sm:left-8) so cards don’t
        touch the screen edge. z-30 keeps cards above the page rule.
      */}
      <ul className="relative z-30 m-0 flex list-none flex-col gap-2 px-4 pb-16 sm:gap-2 sm:px-8 sm:pb-24">
        {collection.products.nodes.map((product, index) => (
          <li key={product.id}>
            <CollectionProductCard
              product={product}
              loading={index < 4 ? 'eager' : 'lazy'}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
