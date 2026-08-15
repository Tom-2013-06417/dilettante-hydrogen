import {useCallback, useEffect, useState} from 'react';
import {
  FIRST_ORDER_OFFER_COPY,
  shouldHideFirstOrderInvite,
} from '~/lib/firstOrderOffer';
import {SubscribeModal} from './SubscribeModal';

type FirstOrderOfferInviteProps = {
  /** Extra classes on the outer row. */
  className?: string;
  /** Quieter treatment for the empty-cart state. */
  align?: 'start' | 'center';
};

/**
 * Quiet inline prompt for the cart drawer. Opens the shared subscribe modal —
 * no auto-popup, no sticky promo bar.
 */
export function FirstOrderOfferInvite({
  className = '',
  align = 'start',
}: FirstOrderOfferInviteProps) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(shouldHideFirstOrderInvite());
  }, [open]);

  const onClose = useCallback(() => {
    setOpen(false);
    setHidden(shouldHideFirstOrderInvite());
  }, []);

  if (hidden) return null;

  return (
    <>
      <span
        className={`mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-['config-mono-vf'] text-[11px] uppercase tracking-[0.08em] text-vellum-100/70 ${
          align === 'center' ? 'justify-center text-center' : ''
        } ${className}`}
      >
        <span>{FIRST_ORDER_OFFER_COPY.inviteLine}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="cursor-pointer border-0 bg-transparent p-0 font-inherit text-[11px] uppercase tracking-[0.08em] text-vellum-100 underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          {FIRST_ORDER_OFFER_COPY.inviteCta}
        </button>
      </span>
      <SubscribeModal open={open} onClose={onClose} />
    </>
  );
}
