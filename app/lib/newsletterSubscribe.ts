/**
 * Teaser mailing-list subscribe.
 *
 * The Online Store `/contact` form (what Liquid uses) is blocked from Oxygen /
 * server-side fetches by Cloudflare bot challenges (403). Use the Admin API
 * instead — same destination (Shopify Customers + email marketing consent).
 */

const ADMIN_API_VERSION = '2025-01';

type SubscribeResult =
  | {ok: true; message: string}
  | {ok: false; error: string; status: number};

type AdminGraphqlResponse<T> = {
  data?: T;
  errors?: Array<{message: string}>;
};

function adminToken(env: Env) {
  return (
    env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim() ||
    env.PRIVATE_ADMIN_API_ACCESS_TOKEN?.trim() ||
    ''
  );
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
    return {ok: false, error: 'Store is not linked yet', status: 503};
  }

  const token = adminToken(env);
  if (!token) {
    return {
      ok: false,
      error:
        'Mailing list is not configured (missing SHOPIFY_ADMIN_API_ACCESS_TOKEN)',
      status: 503,
    };
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
      return {
        ok: false,
        error: create.errors.map((e) => e.message).join('; '),
        status: 502,
      };
    }

    const createErrors = create.data?.customerCreate?.userErrors ?? [];
    if (!createErrors.length && create.data?.customerCreate?.customer?.id) {
      return {ok: true, message: 'Thanks for subscribing!'};
    }

    const alreadyExists = createErrors.some((e) =>
      /already been taken|already exists|email/i.test(e.message),
    );

    if (!alreadyExists) {
      return {
        ok: false,
        error: createErrors[0]?.message ?? 'Could not subscribe. Try again.',
        status: 400,
      };
    }

    const search = await adminGraphql<CustomerSearchData>(
      shopDomain,
      token,
      CUSTOMER_SEARCH,
      {query: `email:${email}`},
    );

    const existingId = search.data?.customers.nodes[0]?.id;
    if (!existingId) {
      return {
        ok: false,
        error: 'Could not subscribe. Try again.',
        status: 502,
      };
    }

    await setMarketingConsent(shopDomain, token, existingId);
    return {ok: true, message: 'Thanks for subscribing!'};
  } catch (error) {
    console.error('teaser subscribe failed', error);
    return {
      ok: false,
      error: 'Could not subscribe. Try again.',
      status: 502,
    };
  }
}
