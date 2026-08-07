import type {Route} from './+types/terms-of-service';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/terms-of-service');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function TermsOfServiceRoute() {
  return (
    <StaticPageShell title={page.title}>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </StaticPageShell>
  );
}
