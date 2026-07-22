import {useRef} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {getScentProfile} from '~/lib/scentProfile';
import {PageContainer} from '~/components/shared';
import {ProductHero} from './ProductHero';
import {ScentAnatomyCue} from './ScentAnatomyPin';
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
  const scentSectionRef = useRef<HTMLElement>(null);

  return (
    <article className="product-page w-full overflow-x-clip">
      {/*
        Sticky parent for SCENT ANATOMY spans hero → end of cube so the
        label pins at 15% from the top through the notes, then leaves
        when the cube section scrolls away.
      */}
      <div className="relative bg-vellum-100">
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
          sectionRef={scentSectionRef}
        />
      </div>

      <section className="relative min-h-svh w-full bg-vellum-100">
        <PageContainer className="flex min-h-svh flex-col items-center justify-center">
          <p className="font-['trust-3a'] text-[13px] tracking-[0.04em] text-inkwell-700/40">
            Placeholder
          </p>
        </PageContainer>
      </section>
    </article>
  );
}
