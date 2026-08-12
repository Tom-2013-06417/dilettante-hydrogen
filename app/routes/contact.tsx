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
  'flex w-full flex-col gap-y-4 text-[14px] tracking-[0.02em] text-inkwell-700/85 [&_a]:font-bold [&_a]:text-inkwell-700! [&_a]:underline [&_a]:underline-offset-2 [&_li]:mb-1! [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-6! [&_ul]:list-disc [&_ul]:pl-5 sm:text-[15px]';

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
 * Centered contact sheet — intentionally not the left-aligned prose / full-bleed
 * shells used by About and Refund Policy. Title and admin copy sit in one
 * measured column in the middle of the page.
 */
export default function ContactRoute() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="static-page flex min-h-full w-full flex-col bg-vellum-paper font-['trust-3a'] text-inkwell-700">
      <HeaderBar />
      <div className="flex grow items-center justify-center">
        <PageContainer>
          <div className="mx-auto flex w-full max-w-[42ch] flex-col items-start px-8 py-16 text-left sm:py-20">
            <h1 className="mb-6! mt-0! font-['config-mono-vf'] text-[20px] font-bold uppercase tracking-[0.14em] sm:text-[24px]">
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
