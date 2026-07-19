import type {ProductFragment} from 'storefrontapi.generated';
import {getScentProfile} from '~/lib/scentProfile';
import {BottleBoxReveal} from './BottleBoxReveal';
import {ProductHero} from './ProductHero';
import {ScentNotesExplorer} from './ScentNotesExplorer';

/** Shopify product id for Forever — long admin title split for display. */
const FOREVER_PRODUCT_ID = 'gid://shopify/Product/7998517837914';
const FOREVER_DISPLAY_TITLE = 'Forever';
const FOREVER_TITLE_SUBTITLE = '(on the Crest of a Wave)';

type ProductPageProps = {
  product: ProductFragment;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
};

export function ProductPage({
  product,
  selectedVariant,
}: Omit<ProductPageProps, 'productOptions'>) {
  const scentProfile = getScentProfile(product);
  const isForever =
    product.handle === 'forever' || product.id === FOREVER_PRODUCT_ID;
  const title = isForever ? FOREVER_DISPLAY_TITLE : product.title;
  const titleSubtitle = isForever ? FOREVER_TITLE_SUBTITLE : undefined;

  return (
    <article className="product-page w-full overflow-x-clip">
      <ProductHero
        title={title}
        titleSubtitle={titleSubtitle}
        image={selectedVariant?.image}
        price={selectedVariant?.price}
        compareAtPrice={selectedVariant?.compareAtPrice}
        selectedVariant={selectedVariant}
        scentProfile={scentProfile}
      />
      <ScentNotesExplorer scentProfile={scentProfile} />
      <BottleBoxReveal title={title} />
    </article>
  );
}
