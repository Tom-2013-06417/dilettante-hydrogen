import type {Route} from './+types/about';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {PageContainer} from '~/components/shared';
import aboutPortrait from '~/assets/design/about-portrait.jpg';
import {pageTitle} from '~/lib/constants';
import {
  ABOUT_CREDITS,
  ABOUT_PARAGRAPHS,
  type AboutCredit,
} from '~/lib/staticPages';

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle('About')}];
};

/** The lead sets beside the portrait; the rest runs full measure below it. */
const [ABOUT_LEAD, ...ABOUT_BODY] = ABOUT_PARAGRAPHS;

/**
 * Same affordance as FAQ inline links. `!` on colour and underline beats
 * reset.css's unlayered `a { text-decoration: none }` / `a { color: #000 }`.
 */
const CREDIT_LINK_CLASS =
  'font-bold text-inkwell-700/90! underline! underline-offset-2 transition-opacity hover:opacity-70 hover:underline!';

function instagramHref(handle: string) {
  return `https://www.instagram.com/${handle}/`;
}

function nameHref(credit: AboutCredit) {
  if (credit.instagram) return instagramHref(credit.instagram);
  if (credit.linkedin) return credit.linkedin;
  return null;
}

function CreditLine({credit}: {credit: AboutCredit}) {
  const href = nameHref(credit);
  const name = href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={CREDIT_LINK_CLASS}
    >
      {credit.name}
    </a>
  ) : (
    credit.name
  );

  return (
    <>
      {credit.prefix}
      {name}
      {credit.github ? (
        <>
          {' ('}
          <a
            href={`https://github.com/${credit.github}`}
            target="_blank"
            rel="noreferrer"
            className={CREDIT_LINK_CLASS}
            aria-label={`${credit.name} on GitHub`}
          >
            GitHub
          </a>
          {')'}
        </>
      ) : null}
      {credit.rest}
    </>
  );
}

/**
 * /about has its own layout rather than StaticPageShell: the portrait sits
 * flush under the header and bleeds off the right edge, with the title and
 * lead paragraph bottom-aligned to it in the column alongside. A vertical
 * blueprint rule runs the portrait's right edge from the header to the footer.
 */
export default function AboutRoute() {
  return (
    <div className="about-page static-page flex min-h-full w-full flex-col bg-vellum-paper font-['trust-3a'] text-inkwell-700">
      <HeaderBar />

      {/*
        Full-height column under the header so the portrait's right-edge rule
        can run from the header's bottom rule straight to the footer.
        `div`, not `section` — reset.css adds bottom padding to every section.
      */}
      <div className="relative grow text-[14px] tracking-[0.02em] [&_p]:leading-6! sm:text-[15px]">
        <PageContainer className="relative h-full">
          {/*
            Right edge of the portrait column (= page-container's right edge;
            the image cancels the inset with -mr). Spans the whole column.
          */}
          <BlueprintRule
            orientation="v"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 text-inkwell-700/35"
          />

          {/*
            No top padding — the portrait is meant to butt against the header's
            bottom rule. `items-stretch` + `justify-end` on the left cell is
            what lands the lead's last line at the portrait's bottom edge.
          */}
          <div className="grid grid-cols-[1fr_39%] items-stretch gap-x-5 sm:gap-x-8">
            <div className="flex flex-col justify-end pl-2">
              {/* `!` on the spacing: reset.css zeroes `h1` margin and padding. */}
              <h1 className="mb-4! mt-0! font-['config-mono-vf'] text-[20px] font-bold uppercase tracking-[0.14em] sm:text-[24px]">
                About
              </h1>
              <p>{ABOUT_LEAD}</p>
            </div>

            {/*
              Bottom rule only — the top meets the header's rule, the right is
              the full-height rule above, and the left stays open to the lead.
            */}
            <div className="relative -mr-4 aspect-square overflow-hidden sm:-mr-8">
              <img
                src={aboutPortrait}
                alt="Paulo behind the Dilettante Perfumery stand, the five debut scents laid out in front of the display board."
                width={800}
                height={800}
                className="h-full w-full rounded-none object-cover"
              />
              <BlueprintRule
                orientation="h"
                className="pointer-events-none absolute inset-x-0 bottom-0 text-inkwell-700/35"
              />
            </div>
          </div>

          {/* svw, not %, so the measure is 75% of the screen rather than of
              the container (which is already inset 16/32px). */}
          <div className="flex max-w-[85svw] flex-col gap-y-5 pb-12 pl-2 pr-8 pt-5 sm:pb-16">
            {ABOUT_BODY.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {/* `!` on both: reset.css sets an unlayered `ul { list-style: none; padding: 0 }`. */}
            <ul className="list-disc! pl-5!">
              {ABOUT_CREDITS.map((credit) => (
                <li key={credit.name}>
                  <CreditLine credit={credit} />
                </li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
