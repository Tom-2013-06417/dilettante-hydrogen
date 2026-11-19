import type {ProductHeroPhotoImage} from '~/components/product/ProductHeroPhoto';
import type {DiscoverySetVariantFragment} from 'storefrontapi.generated';
import type {DiscoverySetContentItem} from './DiscoverySetContentsBand';
import {DiscoverySetFootnote} from './DiscoverySetFootnote';
import {DiscoverySetHero} from './DiscoverySetHero';

type DiscoverySetPageProps = {
  heroImage: ProductHeroPhotoImage | null;
  sideImage: ProductHeroPhotoImage | null;
  items: DiscoverySetContentItem[];
  selectedVariant: DiscoverySetVariantFragment | null;
};

/**
 * Top-of-fold only — same product hero shell (photo, title, price, ATC, side
 * strip). The footnote fills the Scent Anatomy cue slot; no VHS panel.
 */
export function DiscoverySetPage({
  heroImage,
  sideImage,
  items,
  selectedVariant,
}: DiscoverySetPageProps) {
  return (
    <article className="product-page product-page--discovery relative w-full">
      <div className="relative z-10 bg-vellum-paper">
        <div className="product-hero-first-fold product-hero-first-fold--discovery flex flex-col overflow-x-clip sm:overflow-hidden">
          <DiscoverySetHero
            heroImage={heroImage}
            sideImage={sideImage}
            items={items}
            selectedVariant={selectedVariant}
          />
        </div>
        <DiscoverySetFootnote />
      </div>
    </article>
  );
}
