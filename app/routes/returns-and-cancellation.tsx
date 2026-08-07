import type {Route} from './+types/returns-and-cancellation';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/returns-and-cancellation');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function ReturnsAndCancellationRoute() {
  return (
    <StaticPageShell title={page.title}>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </StaticPageShell>
  );
}
