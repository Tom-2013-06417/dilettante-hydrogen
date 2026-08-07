import type {Route} from './+types/privacy-policy';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/privacy-policy');

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle(page.title)}];
};

export default function PrivacyPolicyRoute() {
  return (
    <StaticPageShell title={page.title}>
      {page.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </StaticPageShell>
  );
}
