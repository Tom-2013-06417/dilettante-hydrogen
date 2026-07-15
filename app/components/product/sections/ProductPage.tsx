import type {ProductFragment} from 'storefrontapi.generated';
import {getScentProfile} from '~/lib/scentProfile';
import {BottleBoxReveal} from './BottleBoxReveal';
import {ProductHero} from './ProductHero';
import {ScentNotesExplorer} from './ScentNotesExplorer';

type ProductPageProps = {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
};

export function ProductPage({
  product,
  selectedVariant,
}: Omit<ProductPageProps, 'productOptions'>) {
  const scentProfile = getScentProfile(product.handle);

  return (
    <article className="product-page w-full">
      <ProductHero
        title={product.title}
        image={selectedVariant?.image}
        price={selectedVariant?.price}
        compareAtPrice={selectedVariant?.compareAtPrice}
        selectedVariant={selectedVariant}
        scentProfile={scentProfile}
      />
      <ScentNotesExplorer scentProfile={scentProfile} />
      <BottleBoxReveal title={product.title} />
    </article>
  );
}
