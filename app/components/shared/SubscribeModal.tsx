import {AnimatePresence, motion} from 'motion/react';
import {useCallback, useEffect, useId, useRef} from 'react';
import {createPortal} from 'react-dom';
import {
  FIRST_ORDER_OFFER_COPY,
  markFirstOrderOfferSubscribed,
} from '~/lib/firstOrderOffer';
import {SubscribeForm} from './SubscribeForm';
import {CloseIcon} from './CloseIcon';

type SubscribeModalProps = {
  open: boolean;
  onClose: () => void;
  /** Override the default first-order offer line. */
  line?: string;
  /** Override the underlined trailing CTA word. */
  cta?: string;
};

/**
 * Centred signup dialog over a scrim. Reuses SubscribeForm with the input
 * shown straight away, since the footer's Subscribe button already served as
 * the collapsed CTA.
 */
export function SubscribeModal({
  open,
  onClose,
  line = FIRST_ORDER_OFFER_COPY.modalLine,
  cta = FIRST_ORDER_OFFER_COPY.modalCta,
}: SubscribeModalProps) {
  const labelId = useId();
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
          <div className="mt-[40svh] w-full max-w-lg -translate-y-1/2">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby={labelId}
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

              <p
                id={labelId}
                className="mb-7! max-w-[42ch] pr-8 font-['trust-3a']! text-[20px] leading-snug! tracking-[0.02em]! text-vellum-100! sm:text-[22px]"
              >
                {line}{' '}
                <span className="underline underline-offset-4">{cta}</span>
              </p>

              <SubscribeForm
                className="w-full"
                startOpen
                focusOnMount
                onSuccess={markFirstOrderOfferSubscribed}
              />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
