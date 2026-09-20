import {SubscribeForm} from './SubscribeForm';

type NewsletterSignupProps = {
  className?: string;
};

/** Signup label — designed lockup copy, not Admin-managed. */
const NEWSLETTER_TITLE = 'Sign up and get 10% off your first order';

/**
 * Hardcoded brand line — italics are part of the designed lockup.
 */
function BrandOneLiner() {
  return (
    <div className="mb-6 w-[70%] text-[22px] leading-[1.35] tracking-[0.02em] md:text-[15px] md:leading-6">
      Dilettante is a Manila-based artisan perfumery making{' '}
      <em>bold</em>, <em>conceptual</em>, <em>and otherworldly</em> scents.
    </div>
  );
}

/**
 * Brand one-liner, signup label, and SubscribeForm.
 * Avoids heading/`p` tags so reset.css rules don’t fight Tailwind.
 */
export function NewsletterSignup({className}: NewsletterSignupProps) {
  return (
    <div className={className}>
      <BrandOneLiner />
      <span className="mb-3 block font-['config-mono-vf'] text-[11px] font-normal uppercase tracking-[0.08em] text-vellum-100/80">
        {NEWSLETTER_TITLE}
      </span>
      <SubscribeForm className="w-full" startOpen />
    </div>
  );
}
