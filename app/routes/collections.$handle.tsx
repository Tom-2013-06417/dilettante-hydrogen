import {redirect} from 'react-router';
import type {Route} from './+types/collections.$handle';

/**
 * Multi-collection URLs aren't live yet — everything canonicalizes to /collections.
 */
export async function loader({request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  return redirect(`/collections${url.search}`);
}

export default function CollectionHandleRedirect() {
  return null;
}
