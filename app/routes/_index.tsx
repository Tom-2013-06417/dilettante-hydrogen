import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {HomePage} from '~/components/home';
import {MockShopNotice} from '~/components/shared';
import {pageTitle} from '~/lib/constants';

export const meta: Route.MetaFunction = () => {
  return [{title: pageTitle()}];
};

export async function loader({context}: Route.LoaderArgs) {
  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
  };
}

export default function Homepage() {
  const {isShopLinked} = useLoaderData<typeof loader>();

  return (
    <div className="home-page">
      {!isShopLinked ? (
        <div className="absolute left-0 right-0 top-0 z-50 p-3">
          <MockShopNotice />
        </div>
      ) : null}
      <HomePage />
    </div>
  );
}
