import {useLoaderData} from 'react-router';
import type {Route} from './+types/contact';
import {HeaderBar} from '~/components/home/sections/HeaderBar';
import {PageContainer} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/contact');

/**
 * Shopify Admin contact HTML is a flat tree of block elements. Spacing and
 * list markers are restated here because reset.css collapses them.
 */
const POLICY_HTML_CLASS =
  'flex flex-col gap-y-5 [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-2 [&_li]:mb-1! [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: pageTitle(data?.policy.title ?? page.title)}];
};

export async function loader({context}: Route.LoaderArgs) {
  const data = await context.storefront.query(CONTACT_INFORMATION_QUERY, {
    variables: {
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.contactInformation;
  if (!policy) {
    throw new Response('Contact information not found', {status: 404});
  }

  return {policy};
}

/**
 * Matches /about's body column: left-aligned to the container gutter (`pl-2`),
 * measured at 85svw, same type scale and bottom padding.
 */
export default function ContactRoute() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="static-page flex min-h-full w-full flex-col bg-vellum-paper font-['trust-3a'] text-inkwell-700">
      <HeaderBar />
      {/* `div`, not `section` — reset.css adds bottom padding to every section. */}
      <div className="grow text-[14px] tracking-[0.02em] [&_p]:leading-6! sm:text-[15px]">
        <PageContainer>
          <div className="flex max-w-[85svw] flex-col gap-y-5 pt-20 pb-12 pl-2 pr-8 sm:pb-16">
            <h1 className="mb-0! mt-0! font-['config-mono-vf'] text-[20px] font-bold uppercase tracking-[0.14em] sm:text-[24px]">
              {page.title}
            </h1>
            <div
              className={POLICY_HTML_CLASS}
              dangerouslySetInnerHTML={{__html: policy.body}}
            />
          </div>
        </PageContainer>
      </div>
    </div>
  );
}

const CONTACT_INFORMATION_QUERY = `#graphql
  query ContactInformation(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      contactInformation {
        body
        handle
        id
        title
        url
      }
    }
  }
` as const;
