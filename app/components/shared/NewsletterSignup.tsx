import type {ReactNode} from 'react';
import {RichText} from '@shopify/hydrogen';
import {SubscribeForm} from './SubscribeForm';

type NewsletterSignupProps = {
  className?: string;
  /** Rich text JSON from shop metafield `custom.footer_brand_line`. */
  brandLine?: string | null;
};

/** Signup label — designed lockup copy, not Admin-managed. */
const NEWSLETTER_TITLE = 'Sign up and get 10% off your first order';

/** Spans instead of RichText's default `<div>`/`<p>` so reset.css rules don't apply. */
const BRAND_LINE_COMPONENTS = {
  root: ({node}: {node: {children?: ReactNode[]}}) => <>{node.children}</>,
  paragraph: ({node}: {node: {children?: ReactNode[]}}) => (
    <span className="block">{node.children}</span>
  ),
};

function BrandOneLiner({data}: {data?: string | null}) {
  if (!data) return null;
  return (
    <RichText
      data={data}
      components={BRAND_LINE_COMPONENTS}
      className="mb-6 w-[70%] text-[22px] leading-[1.35] tracking-[0.02em] md:text-[15px] md:leading-6"
    />
  );
}

/**
 * Brand one-liner, signup label, and SubscribeForm.
 * Avoids heading/`p` tags so reset.css rules don’t fight Tailwind.
 */
export function NewsletterSignup({className, brandLine}: NewsletterSignupProps) {
  return (
    <div className={className}>
      <BrandOneLiner data={brandLine} />
      <span className="mb-3 block font-['config-mono-vf'] text-[11px] font-normal uppercase tracking-[0.08em] text-vellum-100/80">
        {NEWSLETTER_TITLE}
      </span>
      <SubscribeForm className="w-full" startOpen />
    </div>
  );
}
