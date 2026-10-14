import {redirect} from 'react-router';
import type {Route} from './+types/samples';

// TODO: Once /samples has its own landing page, flip this redirect: render the
// page here and redirect /collections?sample_highlight=t to /samples.
export async function loader({request}: Route.LoaderArgs) {
  const url = new URL(request.url);
  url.searchParams.set('sample_highlight', 't');
  return redirect(`/collections${url.search}`);
}

export default function SamplesRedirect() {
  return null;
}
