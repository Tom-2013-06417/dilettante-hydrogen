import {
  FIRST_ORDER_OFFER_COPY,
  markFirstOrderOfferSubscribed,
} from '~/lib/firstOrderOffer';
import {SubscribeForm} from './SubscribeForm';

type NewsletterSignupProps = {
  /** Shop metafield `custom.brand_one_liner`. */
  brandOneLiner?: string;
  className?: string;
};

/**
 * Inline newsletter block: brand one-liner, signup label, and SubscribeForm.
 * Avoids heading/`p` tags so reset.css unlayered rules don’t fight Tailwind.
 */
export function NewsletterSignup({
  brandOneLiner,
  className = '',
}: NewsletterSignupProps) {
  return (
    <div className={className || undefined}>
      {brandOneLiner ? (
        <div className="mb-6 max-w-[42ch] text-[14px] leading-6 tracking-[0.02em] sm:text-[15px]">
          {brandOneLiner}
        </div>
      ) : null}

      {/* Match footer link type (config-mono, 11px caps). */}
      <span className="mb-3 block font-['config-mono-vf'] text-[11px] font-normal uppercase tracking-[0.08em]">
        {FIRST_ORDER_OFFER_COPY.modalTitle}
      </span>

      <SubscribeForm
        className="w-full"
        startOpen
        onSuccess={markFirstOrderOfferSubscribed}
      />
    </div>
  );
}
