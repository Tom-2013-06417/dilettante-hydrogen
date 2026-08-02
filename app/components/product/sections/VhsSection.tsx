import {Image} from '@shopify/hydrogen';
import {useReducedMotion} from 'motion/react';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {VhsSlide} from '~/lib/vhsMetafields';

const AUTO_ADVANCE_MS = 4000;

type VhsSectionProps = {
  slides: VhsSlide[];
};

/**
 * Product VHS section. Below scent anatomy, a static soft crossfade from page
 * vellum into solid inkwell-800 (no scroll-driven animation) — then the
 * teaser-peg slideshow on the solid ground.
 */
export function VhsSection({slides}: VhsSectionProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [carouselActive, setCarouselActive] = useState(false);
  const [index, setIndex] = useState(0);

  const slideCount = slides.length;
  const label = String(index + 1).padStart(2, '0');

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCarouselActive(
          Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.55),
        );
      },
      {threshold: [0.55, 0.75, 1]},
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  useEffect(() => {
    if (!carouselActive) return;
    if (slideCount <= 1) return;
    if (reducedMotion) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [carouselActive, index, reducedMotion, slideCount]);

  return (
    <div
      className="vhs-section relative w-full overflow-x-clip text-vellum-100"
      aria-label="VHS"
    >
      {/*
        Static crossfade band: body vellum shows through at the top and softens
        into solid inkwell — no seam, no scroll-tied animation.
      */}
      <div
        className="pointer-events-none relative h-svh w-full"
        style={{
          backgroundImage: `linear-gradient(
            to bottom,
            transparent 0%,
            rgb(14 22 14 / 0.08) 18%,
            rgb(14 22 14 / 0.22) 34%,
            rgb(14 22 14 / 0.45) 52%,
            rgb(14 22 14 / 0.72) 70%,
            rgb(14 22 14 / 0.92) 86%,
            rgb(14 22 14) 100%
          )`,
        }}
        aria-hidden
      />

      <div className="relative w-full bg-inkwell-800">
        <div
          ref={stageRef}
          className="flex min-h-svh w-full flex-col items-center px-[15svw] py-10 sm:px-24 sm:py-12 lg:px-40"
        >
          {slideCount > 0 ? (
            <div className="flex w-full max-w-2xl flex-1 flex-col">
              <div className="mb-3 flex w-full shrink-0 items-center justify-between">
                <p
                  className="m-0 font-['trust-3a'] text-[12px] font-medium tracking-[0.04em] tabular-nums sm:text-[13px]"
                  aria-live="polite"
                >
                  <span className="sr-only">Slideshow</span>
                  {label}
                </p>
                <ol className="m-0 flex list-none items-stretch gap-1.5 p-0">
                  {slides.map((slide, i) => (
                    <li key={slide.id}>
                      <button
                        type="button"
                        aria-label={`Slide ${i + 1} of ${slideCount}`}
                        aria-current={i === index ? 'true' : undefined}
                        onClick={() => goTo(i)}
                        className={`block cursor-pointer border-0 p-0 transition-[width,background-color] duration-200 ${
                          i === index
                            ? 'h-3.5 w-0.75 bg-vellum-100 sm:h-4'
                            : 'h-3.5 w-0.5 bg-vellum-100/40 sm:h-4'
                        }`}
                      />
                    </li>
                  ))}
                </ol>
              </div>

              <div className="relative min-h-0 w-full flex-1">
                <div className="relative mx-auto aspect-2/3 h-full max-h-[clamp(42svh,70svh,78svh)] w-full overflow-hidden bg-vellum-100/10">
                  {slides.map((slide, i) => {
                    const active = i === index;
                    return (
                      <div
                        key={slide.id}
                        className={`absolute inset-0 ${
                          active
                            ? 'opacity-100'
                            : 'pointer-events-none opacity-0'
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
                          sizes="(min-width: 1024px) 42rem, 70vw"
                          loading={i <= 1 ? 'eager' : 'lazy'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-svh" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
