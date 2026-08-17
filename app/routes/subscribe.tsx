import {data, redirect} from 'react-router';
import type {Route} from './+types/subscribe';
import {subscribeEmail} from '~/lib/newsletterSubscribe';

/**
 * Mailing-list signup. Always available so the form can POST from any page
 * (including the gated teaser).
 */
export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!emailOk) {
    return data({ok: false, error: 'Invalid email'}, {status: 400});
  }

  const result = await subscribeEmail(context.env, email);
  if (!result.ok) {
    return data({ok: false, error: result.error}, {status: result.status});
  }

  return data({ok: true, message: result.message});
}

export async function loader() {
  return redirect('/');
}
