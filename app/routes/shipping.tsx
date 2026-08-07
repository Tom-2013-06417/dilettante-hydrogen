import type {Route} from './+types/shipping';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/shipping');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function ShippingRoute() {
  return (
    <StaticPageShell title={page.title}>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </StaticPageShell>
  );
}
