import {useLoaderData} from 'react-router';
import type {Route} from './+types/returns-and-exchanges';
import {StaticPageShell} from '~/components/shared';
import {pageTitle} from '~/lib/constants';
import {getStaticPage} from '~/lib/staticPages';

const page = getStaticPage('/returns-and-exchanges');

/**
 * Shopify Admin policy HTML is a flat tree of block elements. The prose column
 * already styles `p`; these cover lists and spacing that reset.css otherwise
 * collapses.
 */
const POLICY_HTML_CLASS =
  'flex flex-col gap-y-5 [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-2 [&_li]:mb-1! [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: pageTitle(data?.policy.title ?? page.title)}];
};

export async function loader({context}: Route.LoaderArgs) {
  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      privacyPolicy: false,
      shippingPolicy: false,
      termsOfService: false,
      refundPolicy: true,
      language: context.storefront.i18n?.language,
    },
  });

  const policy = data.shop?.refundPolicy;
  if (!policy) {
    throw new Response('Refund policy not found', {status: 404});
  }

  return {policy};
}

export default function ReturnsAndExchangesRoute() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <StaticPageShell title={page.title} body="full">
      <div
        className={POLICY_HTML_CLASS}
        dangerouslySetInnerHTML={{__html: policy.body}}
      />
    </StaticPageShell>
  );
}

// Same document as policies.$handle — keeps StorefrontQueries typing in sync.
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
    $privacyPolicy: Boolean!
    $refundPolicy: Boolean!
    $shippingPolicy: Boolean!
    $termsOfService: Boolean!
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy @include(if: $privacyPolicy) {
        ...Policy
      }
      shippingPolicy @include(if: $shippingPolicy) {
        ...Policy
      }
      termsOfService @include(if: $termsOfService) {
        ...Policy
      }
      refundPolicy @include(if: $refundPolicy) {
        ...Policy
      }
    }
  }
` as const;
