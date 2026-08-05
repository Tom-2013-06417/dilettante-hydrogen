import {useRef} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {getScentProfile} from '~/lib/scentProfile';
import {parseVhsSlides} from '~/lib/vhsMetafields';
import {ProductHero} from './ProductHero';
import {ScentAnatomyCue} from './ScentAnatomyPin';
import {ScentNotesExplorer} from './ScentNotesExplorer';
import {VhsSection} from './VhsSection';

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
  const vhsSlides = parseVhsSlides(product.vhsImages);
  const isForever =
    product.handle === 'forever' || product.id === FOREVER_PRODUCT_ID;
  const title = isForever ? FOREVER_DISPLAY_TITLE : product.title;
  const titleSubtitle = isForever ? FOREVER_TITLE_SUBTITLE : undefined;
  const scentSectionRef = useRef<HTMLElement>(null);

  return (
    <article className="product-page relative w-full">
      {/*
        Sticky parent for SCENT ANATOMY spans hero → end of cube so the
        label pins at ~10% from the top through the notes, then leaves
        when the cube section scrolls away.

        Keep overflow-x-clip OFF this wrapper. The VHS stage moved it here
        from the article so bloom could bleed, but sticky inside
        overflow-x:clip jitters while pinned (WebKit 247130). Clip on the
        sections that need it instead; VHS already clips its own stage.
      */}
      <div className="relative z-10">
        <div className="flex min-h-[calc(100svh-5rem)] flex-col">
          <ProductHero
            title={title}
            titleSubtitle={titleSubtitle}
            image={selectedVariant?.image}
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
            selectedVariant={selectedVariant}
            scentProfile={scentProfile}
          />
        </div>

        <ScentAnatomyCue scentSectionRef={scentSectionRef} />

        <ScentNotesExplorer
          scentProfile={scentProfile}
          productImageUrl={selectedVariant?.image?.url}
          sectionRef={scentSectionRef}
        />
      </div>

      <VhsSection slides={vhsSlides} />
    </article>
  );
}
