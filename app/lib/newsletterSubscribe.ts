/**
 * Teaser mailing-list subscribe via Admin API.
 *
 * Online Store `/contact` is blocked from Oxygen by Cloudflare (403).
 * Dev Dashboard apps authenticate with Client ID + Secret (client_credentials),
 * then call Admin GraphQL. See:
 * https://shopify.dev/docs/apps/build/dev-dashboard/get-api-access-tokens
 */

const ADMIN_API_VERSION = '2025-01';

type SubscribeResult =
  | {ok: true; message: string}
  | {ok: false; error: string; status: number};

type AdminGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{message: string}>;
};

type TokenCache = {token: string; expiresAt: number};

let cachedAdminToken: TokenCache | null = null;

function shopSubdomain(storeDomain: string) {
  return storeDomain.replace(/\.myshopify\.com$/i, '').trim();
}

/**
 * Resolve an Admin API access token.
 * Prefer Dev Dashboard client credentials; fall back to a static legacy token.
 */
async function getAdminAccessToken(
  env: Env,
  storeDomain: string,
): Promise<string> {
  const staticToken =
    env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
    env.PRIVATE_ADMIN_API_ACCESS_TOKEN?.trim() ||
    '';
  if (staticToken) return staticToken;

  const clientId = env.SHOPIFY_APP_CLIENT_ID?.trim();
  const clientSecret = env.SHOPIFY_APP_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error('MISSING_ADMIN_CREDENTIALS');
  }

  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt - 60_000) {
    return cachedAdminToken.token;
  }

  const shop = shopSubdomain(storeDomain);
  const response = await fetch(
    `https://${shop}.myshopify.com/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('Admin token exchange failed', response.status, body);
    throw new Error(`TOKEN_EXCHANGE_${response.status}`);
  }

  const json = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!json.access_token) {
    throw new Error('TOKEN_EXCHANGE_EMPTY');
  }

  cachedAdminToken = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 86_399) * 1000,
  };

  return cachedAdminToken.token;
}

async function adminGraphql<T>(
  shopDomain: string,
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<AdminGraphqlResponse<T>> {
  const response = await fetch(
    `https://${shopDomain}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    },
  );

  if (!response.ok) {
    throw new Error(`Admin API HTTP ${response.status}`);
  }

  return (await response.json()) as AdminGraphqlResponse<T>;
}

type CustomerCreateData = {
  customerCreate?: {
    customer?: {id: string} | null;
    userErrors: Array<{message: string; field?: string[] | null}>;
  };
};

type CustomerSearchData = {
  customers: {
    nodes: Array<{id: string}>;
  };
};

type ConsentUpdateData = {
  customerEmailMarketingConsentUpdate?: {
    customer?: {id: string} | null;
    userErrors: Array<{message: string}>;
  };
};

const CUSTOMER_CREATE = `#graphql
  mutation TeaserCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_SEARCH = `#graphql
  query TeaserCustomerSearch($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
      }
    }
  }
`;

const CONSENT_UPDATE = `#graphql
  mutation TeaserConsentUpdate($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        message
      }
    }
  }
`;

async function setMarketingConsent(
  shopDomain: string,
  token: string,
  customerId: string,
) {
  const result = await adminGraphql<ConsentUpdateData>(
    shopDomain,
    token,
    CONSENT_UPDATE,
    {
      input: {
        customerId,
        emailMarketingConsent: {
          marketingState: 'SUBSCRIBED',
          marketingOptInLevel: 'SINGLE_OPT_IN',
        },
      },
    },
  );

  const errors =
    result.errors?.map((e) => e.message) ??
    result.data?.customerEmailMarketingConsentUpdate?.userErrors.map(
      (e) => e.message,
    ) ??
    [];

  if (errors.length) {
    throw new Error(errors.join('; '));
  }
}

/**
 * Create-or-update a Shopify customer and mark them subscribed to email marketing.
 */
export async function subscribeTeaserEmail(
  env: Env,
  email: string,
): Promise<SubscribeResult> {
  const shopDomain = env.PUBLIC_STORE_DOMAIN?.trim();
  if (!shopDomain) {
    console.error('teaser subscribe: PUBLIC_STORE_DOMAIN is not set');
    return {ok: false, error: 'Signup unavailable', status: 503};
  }

  let token: string;
  try {
    token = await getAdminAccessToken(env, shopDomain);
  } catch (error) {
    if (error instanceof Error && error.message === 'MISSING_ADMIN_CREDENTIALS') {
      console.error(
        'teaser subscribe: missing SHOPIFY_APP_CLIENT_ID / SHOPIFY_APP_CLIENT_SECRET',
      );
      return {ok: false, error: 'Signup unavailable', status: 503};
    }
    console.error('teaser subscribe: admin auth failed', error);
    return {ok: false, error: "Couldn't subscribe", status: 502};
  }

  try {
    const create = await adminGraphql<CustomerCreateData>(
      shopDomain,
      token,
      CUSTOMER_CREATE,
      {
        input: {
          email,
          tags: ['newsletter', 'teaser'],
          emailMarketingConsent: {
            marketingState: 'SUBSCRIBED',
            marketingOptInLevel: 'SINGLE_OPT_IN',
          },
        },
      },
    );

    if (create.errors?.length) {
      console.error(
        'teaser subscribe: GraphQL errors',
        create.errors.map((e) => e.message).join('; '),
      );
      return {ok: false, error: "Couldn't subscribe", status: 502};
    }

    const createErrors = create.data?.customerCreate?.userErrors ?? [];
    if (!createErrors.length && create.data?.customerCreate?.customer?.id) {
      return {ok: true, message: 'Subscribed'};
    }

    const alreadyExists = createErrors.some((e) =>
      /already been taken|already exists|email/i.test(e.message),
    );

    if (!alreadyExists) {
      console.error(
        'teaser subscribe: customerCreate userErrors',
        createErrors.map((e) => e.message).join('; ') || 'unknown',
      );
      return {ok: false, error: "Couldn't subscribe", status: 400};
    }

    const search = await adminGraphql<CustomerSearchData>(
      shopDomain,
      token,
      CUSTOMER_SEARCH,
      {query: `email:${email}`},
    );

    const existingId = search.data?.customers.nodes[0]?.id;
    if (!existingId) {
      console.error(
        'teaser subscribe: existing customer email not found after conflict',
        email,
      );
      return {ok: false, error: "Couldn't subscribe", status: 502};
    }

    await setMarketingConsent(shopDomain, token, existingId);
    return {ok: true, message: 'Subscribed'};
  } catch (error) {
    console.error('teaser subscribe failed', error);
    return {ok: false, error: "Couldn't subscribe", status: 502};
  }
}
