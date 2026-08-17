import {AnimatePresence, motion} from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {useFetcher} from 'react-router';
import {Spinner} from './Spinner';

/** Practical email check: local@domain.tld (not full RFC). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/** Shared shell so the CTA button and email input match exactly. */
export const CTA_SHELL =
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

type SubscribeFormProps = {
  /** Wrapper class — callers own the width. */
  className?: string;
  /** Copy on the collapsed button. */
  ctaLabel?: string;
  /** Skip the collapsed button and show the input straight away. */
  startOpen?: boolean;
  /** Focus the input on mount. Only meaningful alongside `startOpen`. */
  focusOnMount?: boolean;
  /** Fires once after a successful subscribe response. */
  onSuccess?: () => void;
};

/**
 * Mailing-list signup. POSTs to `/subscribe`, which is always available so
 * this works from any page. Styled for inkwell backgrounds; the autofill
 * overrides live in design.css under `.subscribe-email`.
 */
export function SubscribeForm({
  className = '',
  ctaLabel = 'Join our mailing list',
  startOpen = false,
  focusOnMount = false,
  onSuccess,
}: SubscribeFormProps) {
  const [signupOpen, setSignupOpen] = useState(startOpen);
  const [emailValue, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribeKey, setSubscribeKey] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const inputId = useId();
  const subscribe = useFetcher<SubscribeData>({
    key: `subscribe-${inputId}-${subscribeKey}`,
  });

  const subscribed = subscribe.data?.ok === true;
  const subscribing = subscribe.state !== 'idle';

  const clearEmailErrors = useCallback(() => {
    setEmailError(null);
    setSubscribeKey((key) => key + 1);
  }, []);

  const validateAndClearError = useCallback(
    (value: string) => {
      if (!value.trim()) {
        clearEmailErrors();
        return false;
      }
      if (!isValidEmail(value)) {
        setEmailError('Invalid email');
        return false;
      }
      setEmailError(null);
      return true;
    },
    [clearEmailErrors],
  );

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
      console.error('subscribe error', subscribe.data.error);
      setEmailError(subscribe.data.error);
      return;
    }
    if (subscribe.data.ok === true) {
      onSuccessRef.current?.();
    }
  }, [subscribe.state, subscribe.data]);

  useEffect(() => {
    // Don't steal focus on mount when the input is shown from the start —
    // unless the caller asks for it, as the modal does.
    if (signupOpen && (focusOnMount || !startOpen)) emailRef.current?.focus();
  }, [signupOpen, startOpen, focusOnMount]);

  if (subscribed) {
    return (
      <div className={className}>
        <div
          className={`${CTA_SHELL} relative justify-center pr-9 text-center`}
          role="status"
        >
          <span className="min-w-0 truncate">
            {subscribe.data?.message ?? 'Subscribed'}
          </span>
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-vellum-100">
            <CtaCheckIcon />
          </span>
        </div>
      </div>
    );
  }

  if (!signupOpen) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={() => setSignupOpen(true)}
          className={`${CTA_SHELL} cursor-pointer justify-center transition-[border-color,opacity] duration-200 hover:border-vellum-100 hover:opacity-90`}
        >
          {ctaLabel}
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <subscribe.Form
        method="post"
        action="/subscribe"
        onSubmit={onSubscribeSubmit}
        className="relative w-full transition-opacity duration-200"
      >
        <label className="sr-only" htmlFor={inputId}>
          Email
        </label>
        <div className="relative">
          <input
            ref={emailRef}
            id={inputId}
            name="email"
            type="email"
            inputMode="email"
            required
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Email address"
            disabled={subscribing}
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
            className={`subscribe-email ${CTA_SHELL} m-0 min-w-0 pr-9 text-left outline-none placeholder:text-vellum-100/55`}
          />
          <button
            type="submit"
            disabled={subscribing}
            aria-label={subscribing ? 'Submitting' : 'Subscribe'}
            className="subscribe-submit absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center border-0 p-0 text-vellum-100 disabled:opacity-70"
          >
            {subscribing ? (
              <Spinner />
            ) : (
              <CtaArrowIcon />
            )}
          </button>
          <AnimatePresence>
            {emailError ? (
              <motion.p
                key="subscribe-error"
                initial={{opacity: 0, y: -6}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -6}}
                transition={{duration: 0.15, ease: 'easeOut'}}
                className="pointer-events-none absolute top-[calc(100%+0.75rem)] right-0 left-0 m-0 text-center font-['trust-3a'] text-[11px] tracking-[0.02em] text-vellum-100/80"
                role="alert"
              >
                {emailError}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </subscribe.Form>
    </div>
  );
}
