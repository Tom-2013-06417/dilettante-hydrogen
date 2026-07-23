import {data, redirect} from 'react-router';
import type {Route} from './+types/teaser';
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

    if (!email || !email.includes('@')) {
      return data({ok: false, error: 'Enter a valid email'}, {status: 400});
    }

    const storeDomain = context.env.PUBLIC_STORE_DOMAIN;
    if (!storeDomain) {
      return data(
        {ok: false, error: 'Store is not linked yet'},
        {status: 503},
      );
    }

    try {
      const body = new URLSearchParams();
      body.set('form_type', 'customer');
      body.set('utf8', '✓');
      body.set('contact[email]', email);
      body.set('contact[tags]', 'newsletter, teaser');

      const response = await fetch(`https://${storeDomain}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
        redirect: 'manual',
      });

      // Shopify contact forms typically 302 on success; 422 on validation errors.
      if (response.status >= 400 && response.status !== 302) {
        return data(
          {ok: false, error: 'Could not subscribe. Try again.'},
          {status: 502},
        );
      }

      return data({ok: true, message: 'Thanks for subscribing!'});
    } catch {
      return data(
        {ok: false, error: 'Could not subscribe. Try again.'},
        {status: 502},
      );
    }
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
