import {AnimatePresence, motion} from 'motion/react';
import {useCallback, useEffect, useId, useRef} from 'react';
import {createPortal} from 'react-dom';
import {SubscribeForm} from './SubscribeForm';

function CloseIcon({className}: {className?: string}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden
    >
      <path d="M5.5 5.5 18.5 18.5M18.5 5.5 5.5 18.5" />
    </svg>
  );
}

type SubscribeModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Centred signup dialog over a scrim. Reuses SubscribeForm (same action and
 * validation as the teaser) with the input shown straight away, since the
 * footer's Subscribe button already served as the collapsed CTA.
 */
export function SubscribeModal({open, onClose}: SubscribeModalProps) {
  const titleId = useId();
  /** Where focus came from, so closing returns it to the footer button. */
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  /** Kept in a ref so an inline `onClose` prop can't re-run the open effect. */
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const onOverlayMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Only a press that starts on the scrim itself closes — a drag that ends
      // outside the card after selecting text inside it shouldn't.
      if (event.target === event.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    // SubscribeForm autofocuses the email input; child effects run before this
    // one, so don't pull focus back to the card here.
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const {body} = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    const abortController = new AbortController();
    document.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') onCloseRef.current();
      },
      {signal: abortController.signal},
    );

    return () => {
      abortController.abort();
      body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  // AnimatePresence renders nothing while closed, so the portal is only ever
  // reached on the client.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="subscribe-modal"
          // No vertical padding: it would offset the positioner's 40svh.
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-inkwell-800/70 px-5 backdrop-blur-[2px]"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.18, ease: 'easeOut'}}
          onMouseDown={onOverlayMouseDown}
        >
          {/*
            Positioner, so the card's own transform stays free for motion:
            it centres the card on 40svh rather than mid-viewport, sitting a
            little above true centre.
          */}
          <div className="mt-[40svh] w-full max-w-[32rem] -translate-y-1/2">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby={titleId}
              tabIndex={-1}
              className="relative w-full border border-vellum-100/15 bg-inkwell-800 px-6 pt-8 pb-9 font-['trust-3a'] text-vellum-100 outline-none sm:px-10 sm:pt-10 sm:pb-11"
              initial={{opacity: 0, y: 12, scale: 0.98}}
              animate={{opacity: 1, y: 0, scale: 1}}
              exit={{opacity: 0, y: 8, scale: 0.98}}
              transition={{duration: 0.2, ease: 'easeOut'}}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-vellum-100/70 transition-colors hover:text-vellum-100 sm:top-5 sm:right-5"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              {/*
              Heavy `!` use: app.css and reset.css both set unlayered `h1..h6`
              rules (family, weight, colour, letter-spacing, margin) that
              outrank Tailwind's layered utilities.
            */}
              <h2
                id={titleId}
                className="mb-3! pr-8 font-['trust-3a']! text-[20px] font-normal! tracking-[0.02em]! text-vellum-100! sm:text-[22px]"
              >
                Join our mailing list.
              </h2>
              <p className="mb-7! max-w-[42ch] text-[14px] leading-6! tracking-[0.02em] text-vellum-100/70 sm:text-[15px]">
                Be the first to know when we launch, with early access to new
                releases and everything we make along the way.
              </p>

              <SubscribeForm className="w-full" startOpen focusOnMount />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
