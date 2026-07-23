import {data, redirect} from 'react-router';
import type {Route} from './+types/teaser';
import {subscribeTeaserEmail} from '~/lib/newsletterSubscribe';
import {
  isSiteGated,
  unlockSite,
  verifyPreviewPassword,
} from '~/lib/siteGate';

/**
 * Resource route for teaser mailing-list signup and preview unlock.
 * Always available so the gated teaser UI can POST here from any URL.
 */
export async function action({request, context}: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') ?? '');

  if (intent === 'unlock') {
    const password = String(formData.get('password') ?? '');
    if (!verifyPreviewPassword(context.env, password)) {
      return data({ok: false, error: 'Wrong password'}, {status: 401});
    }
    unlockSite(context.session);
    return data({ok: true});
  }

  if (intent === 'subscribe') {
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!emailOk) {
      return data({ok: false, error: 'Enter a valid email'}, {status: 400});
    }

    const result = await subscribeTeaserEmail(context.env, email);
    if (!result.ok) {
      return data(
        {ok: false, error: result.error},
        {status: result.status},
      );
    }

    return data({ok: true, message: result.message});
  }

  return data({ok: false, error: 'Unknown action'}, {status: 400});
}

export async function loader({context}: Route.LoaderArgs) {
  // Keep /teaser as a POST endpoint only; GET sends people to the home/teaser view.
  if (isSiteGated(context.env, context.session)) {
    return redirect('/');
  }
  return redirect('/');
}
