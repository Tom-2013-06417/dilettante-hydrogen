import {Image} from '@shopify/hydrogen';
import {useCallback, useEffect, useState} from 'react';
import {SubscribeForm} from '~/components/shared/SubscribeForm';
import wordmarkVellum from '~/assets/design/wordmark-vellum.svg';
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import heroLandscape from '~/assets/design/hero-landscape.jpg';
import type {TeaserSlide} from '~/lib/teaserProducts';

const FALLBACK_SLIDES: TeaserSlide[] = [
  {id: 'fallback-1', url: fig01, altText: 'Dilettante'},
  {id: 'fallback-2', url: fig02, altText: 'Dilettante'},
  {id: 'fallback-3', url: heroLandscape, altText: 'Dilettante'},
  {id: 'fallback-4', url: fig01, altText: 'Dilettante'},
  {id: 'fallback-5', url: fig02, altText: 'Dilettante'},
];

const AUTO_ADVANCE_MS = 200;

type TeaserPageProps = {
  slides?: TeaserSlide[];
};

export function TeaserPage({slides: productSlides}: TeaserPageProps) {
  const slides =
    productSlides && productSlides.length > 0 ? productSlides : FALLBACK_SLIDES;

  const [index, setIndex] = useState(0);
  const slideCount = slides.length;

  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  useEffect(() => {
    if (slideCount <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const timer = window.setInterval(() => {
      goTo((index + 1) % slideCount);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [goTo, index, slideCount]);

  return (
    <div className="teaser-page flex flex-col items-center overflow-hidden bg-inkwell-800 px-0 pt-0 pb-5 text-vellum-100 sm:pb-6">
      {/*
        Image: full-bleed to top + side edges. Fills leftover space above the
        date/CTA stack so short phones don't overflow the locked viewport.
      */}
      <div className="relative w-full min-h-0 flex-1 sm:max-h-[clamp(42svh,60svh,68svh)]">
        <div className="relative h-full w-full overflow-hidden bg-vellum-100/10">
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 ${
                  active ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                aria-hidden={!active}
              >
                <Image
                  data={{
                    url: slide.url,
                    altText: slide.altText,
                    width: slide.width ?? 1200,
                    height: slide.height ?? 1800,
                  }}
                  alt={active ? slide.altText : ''}
                  className="h-full w-full rounded-none object-cover"
                  sizes="100vw"
                  loading={i <= 1 ? 'eager' : 'lazy'}
                />
              </div>
            );
          })}
        </div>

        {/*
          Logo width track: 90svw on mobile; capped at 42rem on large screens.
        */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-1 w-[min(90svw,42rem)] -translate-x-1/2 translate-y-[45%]">
          <img
            src={wordmarkVellum}
            alt="Dilettante"
            className="block h-auto w-full max-w-none rounded-none"
          />
        </div>
      </div>

      {/*
        Date / CTA stack — narrower than the wordmark; not full-bleed.
        Logo→date: clamp(1rem, 3.5svh, 1.5rem) — stays compact.
        Date→CTA: clamp opens up on tall screens so the date sits nearer the wordmark.
      */}
      <div className="flex w-full shrink-0 flex-col items-center px-[15svw] sm:max-w-88 sm:px-0 lg:max-w-[24rem]">
        <div
          className="w-full shrink-0"
          style={{
            height: 'calc(min(90svw, 42rem) * 797 / 2881 * 0.45)',
          }}
          aria-hidden
        />
        <div
          className="w-full shrink-0"
          style={{height: 'clamp(1rem, 3.5svh, 1.5rem)'}}
          aria-hidden
        />

        <p className="m-0 shrink-0 text-center font-['wayfinder-cf'] text-[28px] font-light tracking-[-0.04em] text-vellum-100 opacity-75">
          08. 08. 2026
        </p>

        <div
          className="w-full shrink-0"
          style={{height: 'clamp(4svh, 6svh, 12svh)'}}
          aria-hidden
        />

        <SubscribeForm className="w-full max-w-56 shrink-0 pb-[clamp(1svh,5svh,8svh)] sm:max-w-60" />
      </div>
    </div>
  );
}
