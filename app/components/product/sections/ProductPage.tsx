import {useRef} from 'react';
import type {ProductFragment} from 'storefrontapi.generated';
import {useStackCoverRevealed} from '~/components/layout/PageTransition';
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
  const scenesSectionRef = useRef<HTMLElement>(null);
  // During collection→product cover, skip below-fold / WebGL until slide ends.
  const coverRevealed = useStackCoverRevealed();

  return (
    <article className="product-page relative w-full">
      {/*
        Sticky parent for SCENT ANATOMY spans hero → end of cube so the
        label pins at ~10% from the top through the notes, then leaves
        when the cube section scrolls away.

        bg-vellum-paper lives HERE (not on body / settled stack). Product
        scroll-roots are inkwell so VHS bottom chrome/rubber-band never
        flashes vellum. HeaderBar has its own grain.

        Keep overflow-x-clip OFF this wrapper. The VHS stage moved it here
        from the article so bloom could bleed, but sticky inside
        overflow-x:clip jitters while pinned (WebKit 247130). Clip on the
        sections that need it instead; VHS already clips its own stage.
      */}
      <div className="relative z-10 bg-vellum-paper">
        <div className="flex min-h-[calc(100svh-5rem-var(--stack-header-h,3rem))] flex-col">
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

        {coverRevealed ? (
          <>
            <ScentAnatomyCue scentSectionRef={scentSectionRef} />

            <ScentNotesExplorer
              scentProfile={scentProfile}
              productImageUrl={selectedVariant?.image?.url}
              sectionRef={scentSectionRef}
              scenesSectionRef={scenesSectionRef}
            />
          </>
        ) : null}
      </div>

      {coverRevealed ? (
        <VhsSection slides={vhsSlides} sectionRef={scenesSectionRef} />
      ) : null}
    </article>
  );
}
