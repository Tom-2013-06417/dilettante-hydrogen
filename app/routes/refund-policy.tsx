import type {Route} from './+types/refund-policy';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/refund-policy');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function RefundPolicyRoute() {
  return (
    <StaticPageShell title={page.title}>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </StaticPageShell>
  );
}
