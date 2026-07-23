import {useCallback, useEffect, useRef, useState} from 'react';
import {useFetcher, useNavigation, useRevalidator} from 'react-router';
import wordmarkVellum from '~/assets/design/wordmark-vellum.svg';
import fig01 from '~/assets/design/fig-01.jpg';
import fig02 from '~/assets/design/fig-02.jpg';
import heroLandscape from '~/assets/design/hero-landscape.jpg';

const SLIDES = [
  {src: fig01, alt: 'Dilettante teaser'},
  {src: fig02, alt: 'Dilettante teaser'},
  {src: heroLandscape, alt: 'Dilettante teaser'},
  {src: fig01, alt: 'Dilettante teaser'},
  {src: fig02, alt: 'Dilettante teaser'},
] as const;

/** Shared shell so the CTA button and email input match exactly. */
const CTA_SHELL =
  "box-border w-full appearance-none border border-vellum-100/55 bg-transparent px-3 py-2.5 font-['config-mono-vf'] text-[11px] font-medium leading-none tracking-[0.06em] text-vellum-100 sm:py-3";

type SubscribeData = {
  ok?: boolean;
  error?: string;
  message?: string;
};

type UnlockData = {
  ok?: boolean;
  error?: string;
};

export function TeaserPage() {
  const [index, setIndex] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [unlockOpen, setUnlockOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const subscribe = useFetcher<SubscribeData>();
  const unlock = useFetcher<UnlockData>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const slideCount = SLIDES.length;
  const label = String(index + 1).padStart(2, '0');
  const subscribed = subscribe.data?.ok === true;
  const subscribeError = subscribe.data?.error;
  const unlockError = unlock.data?.error;
  const busy =
    subscribe.state !== 'idle' ||
    unlock.state !== 'idle' ||
    navigation.state !== 'idle';

  const goTo = useCallback((next: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    el.scrollTo({left: next * width, behavior: 'smooth'});
    setIndex(next);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => {
      const width = el.clientWidth || 1;
      const next = Math.round(el.scrollLeft / width);
      setIndex(Math.max(0, Math.min(slideCount - 1, next)));
    };

    el.addEventListener('scroll', onScroll, {passive: true});
    return () => el.removeEventListener('scroll', onScroll);
  }, [slideCount]);

  useEffect(() => {
    if (unlock.data?.ok) {
      setUnlockOpen(false);
      revalidator.revalidate();
    }
  }, [unlock.data?.ok, revalidator]);

  useEffect(() => {
    if (signupOpen) emailRef.current?.focus();
  }, [signupOpen]);

  return (
    <div className="flex h-svh max-h-svh flex-col items-center overflow-hidden bg-inkwell-800 px-[15svw] pt-[5svh] pb-5 text-vellum-100 sm:px-24 sm:pt-6 sm:pb-6 lg:px-40">
      <div className="flex w-full min-h-0 flex-1 flex-col items-center sm:max-w-[22rem] lg:max-w-[24rem]">
        <div className="mb-3 flex w-full shrink-0 items-center justify-between">
          <p
            className="m-0 font-['trust-3a'] text-[12px] font-medium tracking-[0.04em] tabular-nums sm:text-[13px]"
            aria-live="polite"
          >
            <span className="sr-only">Slideshow</span>
            {label}
          </p>
          <ol className="m-0 flex list-none items-stretch gap-1.5 p-0">
            {SLIDES.map((_, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Slide ${i + 1} of ${slideCount}`}
                  aria-selected={i === index}
                  onClick={() => goTo(i)}
                  className={`block border-0 p-0 transition-[width,background-color] duration-200 ${
                    i === index
                      ? 'h-3.5 w-[3px] bg-vellum-100 sm:h-4'
                      : 'h-3.5 w-0.5 bg-vellum-100/40 sm:h-4'
                  }`}
                />
              </li>
            ))}
          </ol>
        </div>

        {/* Image fills leftover height; logo hangs onto the seam without taking footer space. */}
        <div className="relative min-h-0 w-full flex-1">
          <div className="relative mx-auto h-full max-h-[clamp(42svh,60svh,68svh)] w-full">
            <div
              ref={scrollerRef}
              className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {SLIDES.map((slide, i) => (
                <div
                  key={`${slide.src}-${i}`}
                  className="flex h-full w-full shrink-0 snap-center justify-center"
                >
                  <div className="aspect-[2/3] h-full w-auto max-w-full overflow-hidden bg-vellum-100/10">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      className="h-full w-full rounded-none object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : 'low'}
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>

            <img
              src={wordmarkVellum}
              alt="Dilettante"
              className="pointer-events-none absolute bottom-0 left-1/2 z-1 block h-auto w-[90svw] max-w-none -translate-x-1/2 translate-y-[45%] rounded-none"
            />
          </div>
        </div>

        {/*
          Date stays in the mailing-list stack (shrink-0, always visible).
          Logo→date: clamp(1rem, 3.5svh, 1.5rem) — stays compact.
          Date→CTA: clamp(1rem, 10svh - 3rem, 5.5rem) — ~equal on short screens,
          opens up on tall so the date sits nearer the wordmark.
        */}
        <div className="flex w-full shrink-0 flex-col items-center">
          <div
            className="w-full shrink-0"
            style={{height: 'calc(90svw * 797 / 2881 * 0.45)'}}
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
            style={{height: 'clamp(1rem, 10svh - 3rem, 5.5rem)'}}
            aria-hidden
          />

          <div className="w-full max-w-[14rem] shrink-0 pb-[clamp(2.5rem,5svh,10svh)] sm:max-w-[15rem]">
            {subscribed ? (
              <p className="m-0 text-center font-['config-mono-vf'] text-[11px] tracking-[0.06em]">
                {subscribe.data?.message ?? 'Thanks for subscribing!'}
              </p>
            ) : signupOpen ? (
              <subscribe.Form
                method="post"
                action="/teaser"
                className="w-full transition-opacity duration-200"
              >
                <input type="hidden" name="intent" value="subscribe" />
                <label className="sr-only" htmlFor="teaser-email">
                  Email
                </label>
                <input
                  ref={emailRef}
                  id="teaser-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoCorrect="off"
                  autoCapitalize="off"
                  placeholder="Email address"
                  disabled={busy}
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className={`${CTA_SHELL} m-0 min-w-0 text-center outline-none placeholder:text-vellum-100/55`}
                />
                {subscribeError ? (
                  <p className="mt-3 m-0 text-center font-['trust-3a'] text-[11px] tracking-[0.02em] text-vellum-100/80">
                    {subscribeError}
                  </p>
                ) : null}
              </subscribe.Form>
            ) : (
              <button
                type="button"
                onClick={() => setSignupOpen(true)}
                className={`${CTA_SHELL} transition-[border-color,opacity] duration-200 hover:border-vellum-100 hover:opacity-90`}
              >
                Join our mailing list
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
