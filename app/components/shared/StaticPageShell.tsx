import type {ReactNode} from 'react';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {PageContainer} from './PageContainer';

/**
 * `prose` is the measured reading column; `full` spans the container for content
 * that draws its own rules edge to edge, like the FAQ accordion.
 */
const BODY_CLASS = {
  prose:
    'flex max-w-[36ch] flex-col gap-y-5 text-[14px] tracking-[0.02em] text-inkwell-700 [&_p]:leading-6! sm:max-w-[46ch] sm:text-[15px]',
  full: 'flex w-full flex-col text-[14px] tracking-[0.02em] text-inkwell-700 [&_p]:leading-6! sm:text-[15px]',
} as const;

/**
 * Chrome for every static page: the site header over the shared vellum paper
 * grain, with a mono title and a body column. `[&_p]:leading-6!` and the `!`
 * on the title margins are required because reset.css sets unlayered `p`/`h1`
 * rules that outrank Tailwind's layered utilities.
 *
 * /about does NOT use this — it has its own layout (see app/routes/about.tsx).
 */
export function StaticPageShell({
  title,
  body = 'prose',
  children,
}: {
  title: string;
  body?: keyof typeof BODY_CLASS;
  children: ReactNode;
}) {
  return (
    <div className="static-page flex w-full flex-col bg-vellum-paper font-['trust-3a'] text-inkwell-700">
      <HeaderBar />
      {/* `div`, not `section` — reset.css adds bottom padding to every section. */}
      <div className="grow">
        <PageContainer>
          <div className="pb-12 pl-2 pr-8 pt-6 sm:pb-16 sm:pt-10">
            <h1 className="mb-4! mt-6! font-['config-mono-vf'] text-[20px] font-bold uppercase tracking-[0.14em] sm:text-[24px]">
              {title}
            </h1>
            <div className={BODY_CLASS[body]}>{children}</div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
