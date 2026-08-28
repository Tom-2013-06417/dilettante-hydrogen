import {useMotionValueEvent, useScroll} from 'motion/react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {createPortal} from 'react-dom';
import type {ProductFragment} from 'storefrontapi.generated';
import {useStackCoverRevealed} from '~/components/layout/PageTransition';
import {parseSecondaryImage} from '~/lib/secondaryImageMetafield';
import {getScentProfile, type ScentProfile} from '~/lib/scentProfile';
import {parseVhsSlides, type VhsSlide} from '~/lib/vhsMetafields';
import {ProductHero} from './ProductHero';
import {ScenesGateProvider, useScenesGate} from './scenesGate';
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
  const secondaryImage = parseSecondaryImage(product.secondaryImage);
  const isForever =
    product.handle === 'forever' || product.id === FOREVER_PRODUCT_ID;
  const title = isForever ? FOREVER_DISPLAY_TITLE : product.title;
  const titleSubtitle = isForever ? FOREVER_TITLE_SUBTITLE : undefined;
  const scentSectionRef = useRef<HTMLElement>(null);
  // During collection→product cover, skip below-fold / WebGL until slide ends.
  const coverRevealed = useStackCoverRevealed();

  return (
    <ScenesGateProvider>
      <article className="product-page relative w-full">
        {/*
          bg-vellum-paper lives HERE (not on body / settled stack) so the
          HeaderBar keeps its own grain.

          Keep overflow-x-clip OFF this wrapper. The VHS stage moved it here
          from the article so bloom could bleed, but sticky inside
          overflow-x:clip jitters while pinned (WebKit 247130). Clip on the
          sections that need it instead; the scenes panel clips its own stage.
        */}
        <div className="relative z-10 bg-vellum-paper">
          {/* Full-width clip so 100vw hero rule bleeds don't spawn a scrollbar;
              keep this off the sticky parent above (WebKit + clip jitter). */}
          {/*
            First fold = header + this band + Anatomy cue = 100svh.
            Cue height is defined (--scent-anatomy-cue-h) so dismissing the
            offer strip leaves padding, not a peek of SCENT ANATOMY.
          */}
          <div className="flex min-h-[calc(100svh-var(--stack-header-h,3rem)-var(--scent-anatomy-cue-h,80px))] flex-col overflow-x-clip">
            <ProductHero
              title={title}
              titleSubtitle={titleSubtitle}
              image={selectedVariant?.image}
              secondaryImage={secondaryImage}
              price={selectedVariant?.price}
              compareAtPrice={selectedVariant?.compareAtPrice}
              selectedVariant={selectedVariant}
              scentProfile={scentProfile}
              preorderEta={product.preorderEta}
            />
          </div>

          {coverRevealed ? (
            <>
              <ScentAnatomyCue scentSectionRef={scentSectionRef} />

              <ScentNotesExplorer
                scentProfile={scentProfile}
                productImageUrl={selectedVariant?.image?.url}
                sectionRef={scentSectionRef}
              />
            </>
          ) : null}
        </div>

        {coverRevealed && vhsSlides.length > 0 ? (
          <ScenesOverlay
            slides={vhsSlides}
            scentSectionRef={scentSectionRef}
            title={title}
            titleSubtitle={titleSubtitle}
            scentProfile={scentProfile}
            selectedVariant={selectedVariant}
            preorderEta={product.preorderEta}
          />
        ) : null}
      </article>
    </ScenesGateProvider>
  );
}

/** Scroll through the scent section before the panel is worth mounting. */
const MOUNT_AT_PROGRESS = 0.45;

/**
 * Full-screen scenes panel. Not a route and not a section below the fold: it
 * expands out of the scenes cue once that cue has been filled (or pressed) and
 * collapses back into it, so the document itself still ends at scent anatomy.
 *
 * Portaled to document.body so its z-index can sit between the cart aside
 * (100) and the first-order offer strip. PageTransition's `isolation: isolate`
 * would otherwise trap a local z-40 under the body-portaled strip.
 */
function ScenesOverlay({
  slides,
  scentSectionRef,
  title,
  titleSubtitle,
  scentProfile,
  selectedVariant,
  preorderEta,
}: {
  slides: VhsSlide[];
  scentSectionRef: RefObject<HTMLElement | null>;
  title: string;
  titleSubtitle?: string;
  scentProfile: ScentProfile;
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  preorderEta?: ProductFragment['preorderEta'];
}) {
  const {open, origin, closeScenes} = useScenesGate();
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  /**
   * Latched, never un-latched: mounting early lets the plates prefetch during
   * the cube scrub, and unmounting on close would throw that away.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const {scrollYProgress} = useScroll({
    target: scentSectionRef,
    offset: ['start end', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    if (progress >= MOUNT_AT_PROGRESS) setMounted(true);
  });

  // Covers a reload that lands deep in the section, where no change event fires.
  useEffect(() => {
    if (scrollYProgress.get() >= MOUNT_AT_PROGRESS) setMounted(true);
  }, [scrollYProgress]);

  /**
   * `inert` blocks pointer events and tab focus in one, so a collapsed panel
   * can't swallow clicks meant for the cube behind it. Set on the node because
   * motion's div props don't type it.
   */
  useEffect(() => {
    overlayRef.current?.toggleAttribute('inert', !open);
    if (open) closeRef.current?.focus({preventScroll: true});
  }, [open, portalReady]);

  // Falls back to the viewport centre until the cue has been measured.
  const collapsed = origin ?? 'inset(50% 50% 50% 50%)';

  const overlay = (
    <div
      ref={overlayRef}
      className={`scenes-overlay fixed inset-0 z-60 overflow-hidden bg-inkwell-900${
        open ? ' scenes-overlay--open' : ' pointer-events-none'
      }`}
      style={{'--scenes-origin': collapsed} as CSSProperties}
      aria-hidden={!open}
    >
      {/*
        The panel is dismissed by flicking back up or pressing Escape, neither
        of which a keyboard-only reader can discover. This gives them a real
        control without putting furniture on the design.
      */}
      <button
        ref={closeRef}
        type="button"
        className="sr-only"
        onClick={closeScenes}
      >
        Close scenes
      </button>

      {mounted ? (
        <VhsSection
          slides={slides}
          open={open}
          title={title}
          titleSubtitle={titleSubtitle}
          scentProfile={scentProfile}
          selectedVariant={selectedVariant}
          preorderEta={preorderEta}
        />
      ) : null}
    </div>
  );

  if (!portalReady) return null;
  return createPortal(overlay, document.body);
}
