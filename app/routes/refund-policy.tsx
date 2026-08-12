import {redirect} from 'react-router';

/** Canonical refund policy lives at /returns-and-exchanges (Shopify Admin Policies). */
export async function loader() {
  return redirect('/returns-and-exchanges');
}
