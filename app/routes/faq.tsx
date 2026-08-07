import type {Route} from './+types/faq';
import {FaqAccordion, StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {FAQ_ITEMS, getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/faq');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function FaqRoute() {
  return (
    <StaticPageShell title={page.title} body="full">
      <FaqAccordion items={FAQ_ITEMS} />
    </StaticPageShell>
  );
}
