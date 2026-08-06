import {redirect} from 'react-router';
import type {Route} from './+types/collections.all';

/** Catalog-all is folded into the sole collection at /collections for now. */
export async function loader({request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  return redirect(`/collections${url.search}`);
}

export default function CollectionsAllRedirect() {
  return null;
}
