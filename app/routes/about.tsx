import type {Route} from './+types/about';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {BlueprintRule} from '~/components/product/BlueprintRule';
import {PageContainer} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {ABOUT_CREDITS, ABOUT_PARAGRAPHS} from '~/lib/staticPages';

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle('About')}];
};

/** The lead sets beside the portrait; the rest runs full measure below it. */
const [ABOUT_LEAD, ...ABOUT_BODY] = ABOUT_PARAGRAPHS;

/**
 * /about has its own layout rather than StaticPageShell: the portrait sits
 * flush under the header and bleeds off the right edge, with the title and
 * lead paragraph bottom-aligned to it in the column alongside.
 */
export default function AboutRoute() {
  return (
    <div className="about-page static-page flex min-h-svh w-full flex-col bg-vellum-100 font-['trust-3a'] text-inkwell-700">
      <HeaderBar />

      <section className="grow text-[14px] tracking-[0.02em] [&_p]:leading-6! sm:text-[15px]">
        <PageContainer>
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
              Bottom and left rules only — the top meets the header's rule and
              the right runs off-screen. BlueprintRule rather than a dashed
              border so the dash rhythm matches the header exactly. Swap for an
              <img> once the photo exists.
            */}
            <div
              aria-hidden
              className="relative -mr-4 flex aspect-square items-center justify-center bg-inkwell-700/5 sm:-mr-8"
            >
              <BlueprintRule
                orientation="v"
                className="pointer-events-none absolute inset-y-0 left-0 text-inkwell-700/35"
              />
              <BlueprintRule
                orientation="h"
                className="pointer-events-none absolute inset-x-0 bottom-0 text-inkwell-700/35"
              />
              <span className="font-['config-mono-vf'] text-[11px] uppercase tracking-[0.14em] text-inkwell-700/45">
                Photo
              </span>
            </div>
          </div>

          {/* svw, not %, so the measure is 75% of the screen rather than of
              the container (which is already inset 16/32px). */}
          <div className="flex max-w-[85svw] flex-col gap-y-5 pb-24 pl-2 pr-8 pt-5">
            {ABOUT_BODY.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {/* `!` on both: reset.css sets an unlayered `ul { list-style: none; padding: 0 }`. */}
            <ul className="list-disc! pl-5!">
              {ABOUT_CREDITS.map((credit) => (
                <li key={credit}>{credit}</li>
              ))}
            </ul>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
