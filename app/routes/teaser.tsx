import {redirect} from 'react-router';

/** Old gated-site URL. The teaser now lives on `/` while the site is gated. */
export async function loader() {
  return redirect('/');
}
