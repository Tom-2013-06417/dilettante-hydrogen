import {Image} from '@shopify/hydrogen';
import {AnimatePresence, motion} from 'motion/react';
import {useCallback, useEffect, useRef, useState, type FormEvent} from 'react';
import {useFetcher, useNavigation, useRevalidator} from 'react-router';
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

/** Practical email check: local@domain.tld (not full RFC). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/** Shared shell so the CTA button and email input match exactly. */
const CTA_SHELL =
  "box-border flex h-10 w-full appearance-none items-center border border-vellum-100/55 bg-transparent px-3 font-['config-mono-vf'] text-[11px] font-medium leading-none tracking-[0.06em] text-vellum-100 sm:h-11";

function CtaArrowIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function CtaSpinnerIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle
        cx="7"
        cy="7"
        r="5.25"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.25"
      />
      <path
        d="M12.25 7a5.25 5.25 0 0 0-5.25-5.25"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
      />
    </svg>
  );
}

function CtaCheckIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 7.25 5.5 10.25 11.5 3.75"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

type SubscribeData = {
  ok?: boolean;
  error?: string;
  message?: string;
};

type UnlockData = {
  ok?: boolean;
  error?: string;
};

type TeaserPageProps = {
  slides?: TeaserSlide[];
};

export function TeaserPage({slides: productSlides}: TeaserPageProps) {
  const slides =
    productSlides && productSlides.length > 0 ? productSlides : FALLBACK_SLIDES;

  const [index, setIndex] = useState(0);
  const [signupOpen, setSignupOpen] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribeKey, setSubscribeKey] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const subscribe = useFetcher<SubscribeData>({
    key: `teaser-subscribe-${subscribeKey}`,
  });
  const unlock = useFetcher<UnlockData>();
  const navigation = useNavigation();
  const revalidator = useRevalidator();

  const slideCount = slides.length;
  const subscribed = subscribe.data?.ok === true;
  const subscribeError = emailError;
  const subscribing = subscribe.state !== 'idle';
  const busy =
    subscribing || unlock.state !== 'idle' || navigation.state !== 'idle';

  const goTo = useCallback((next: number) => {
    setIndex(next);
  }, []);

  const clearEmailErrors = useCallback(() => {
    setEmailError(null);
    setSubscribeKey((key) => key + 1);
  }, []);

  const validateAndClearError = useCallback((value: string) => {
    if (!value.trim()) {
      clearEmailErrors();
      return false;
    }
    if (!isValidEmail(value)) {
      setEmailError('Enter a valid email');
      return false;
    }
    setEmailError(null);
    return true;
  }, [clearEmailErrors]);

  const onSubscribeSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (!validateAndClearError(emailValue)) {
        event.preventDefault();
        emailRef.current?.focus();
      }
    },
    [emailValue, validateAndClearError],
  );

  useEffect(() => {
    if (subscribe.state !== 'idle' || !subscribe.data) return;
    if (subscribe.data.ok === false && subscribe.data.error) {
      setEmailError(subscribe.data.error);
    }
  }, [subscribe.state, subscribe.data]);

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

  useEffect(() => {
    if (unlock.data?.ok) {
      void revalidator.revalidate();
    }
  }, [unlock.data?.ok, revalidator]);

  useEffect(() => {
    if (signupOpen) emailRef.current?.focus();
  }, [signupOpen]);

  return (
    <div className="flex h-svh max-h-svh flex-col items-center overflow-hidden bg-inkwell-800 px-0 pt-0 pb-5 text-vellum-100 sm:px-24 sm:pt-6 sm:pb-6 lg:px-40">
      <div className="flex w-full min-h-0 flex-1 flex-col items-center sm:max-w-[22rem] lg:max-w-[24rem]">
        {/*
          Mobile: image flush to top + side edges; height capped so date/CTA stay in view.
          sm+: keep the inset column + height clamp.
        */}
        <div className="relative w-full shrink-0 sm:min-h-0 sm:flex-1">
          <div className="relative mx-auto flex w-full justify-center sm:h-full sm:max-h-[clamp(42svh,60svh,68svh)]">
            <div className="relative h-[65svh] w-full overflow-hidden bg-vellum-100/10 sm:aspect-[2/3] sm:h-full sm:w-auto sm:max-w-full">
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
                      sizes="(min-width: 1024px) 24rem, (min-width: 640px) 22rem, 100vw"
                      loading={i <= 1 ? 'eager' : 'lazy'}
                    />
                  </div>
                );
              })}
            </div>

            {/*
              Logo width track: 90svw on mobile; capped on desktop.
            */}
            <div className="pointer-events-none absolute bottom-0 left-1/2 z-1 w-[min(90svw,42rem)] -translate-x-1/2 translate-y-[45%]">
              <img
                src={wordmarkVellum}
                alt="Dilettante"
                className="block h-auto w-full max-w-none rounded-none"
              />
            </div>
          </div>
        </div>

        {/*
          Date stays in the mailing-list stack (shrink-0, always visible).
          Logo→date: clamp(1rem, 3.5svh, 1.5rem) — stays compact.
          Date→CTA: clamp(1rem, 10svh - 3rem, 5.5rem) — ~equal on short screens,
          opens up on tall so the date sits nearer the wordmark.
        */}
        <div className="flex w-full shrink-0 flex-col items-center px-[15svw] sm:px-0">
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

          <div className="w-full max-w-[14rem] shrink-0 pb-[clamp(1svh,5svh,8svh)] sm:max-w-[15rem]">
            {subscribed ? (
              <div
                className={`${CTA_SHELL} relative justify-center pr-9 text-center`}
                role="status"
              >
                <span className="min-w-0 truncate">
                  {subscribe.data?.message ?? 'Thanks for subscribing!'}
                </span>
                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-vellum-100">
                  <CtaCheckIcon />
                </span>
              </div>
            ) : signupOpen ? (
              <subscribe.Form
                method="post"
                action="/teaser"
                onSubmit={onSubscribeSubmit}
                className="relative w-full transition-opacity duration-200"
              >
                <input type="hidden" name="intent" value="subscribe" />
                <label className="sr-only" htmlFor="teaser-email">
                  Email
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="teaser-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    required
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="Email address"
                    disabled={busy}
                    value={emailValue}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEmailValue(next);
                      if (!next.trim()) {
                        clearEmailErrors();
                      } else if (emailError) {
                        setEmailError(null);
                      }
                    }}
                    onBlur={() => {
                      if (emailValue.trim()) validateAndClearError(emailValue);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      // Ensure Enter submits the fetcher form (arrow = same path).
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }}
                    className={`${CTA_SHELL} m-0 min-w-0 pr-9 text-left outline-none placeholder:text-vellum-100/55`}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    aria-label={subscribing ? 'Submitting' : 'Subscribe'}
                    className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-vellum-100 disabled:opacity-70"
                  >
                    {subscribing ? (
                      <CtaSpinnerIcon className="motion-safe:animate-[teaser-spin_0.7s_linear_infinite]" />
                    ) : (
                      <CtaArrowIcon />
                    )}
                  </button>
                  <AnimatePresence>
                    {subscribeError ? (
                      <motion.p
                        key="teaser-email-error"
                        initial={{opacity: 0, y: -6}}
                        animate={{opacity: 1, y: 0}}
                        exit={{opacity: 0, y: -6}}
                        transition={{duration: 0.15, ease: 'easeOut'}}
                        className="pointer-events-none absolute top-[calc(100%+0.75rem)] right-0 left-0 m-0 text-center font-['trust-3a'] text-[11px] tracking-[0.02em] text-vellum-100/80"
                        role="alert"
                      >
                        {subscribeError}
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              </subscribe.Form>
            ) : (
              <button
                type="button"
                onClick={() => setSignupOpen(true)}
                className={`${CTA_SHELL} justify-center transition-[border-color,opacity] duration-200 hover:border-vellum-100 hover:opacity-90`}
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
