# Dilettante Hydrogen

Headless Shopify storefront for Dilettante, built with [Hydrogen](https://shopify.dev/docs/storefronts/headless/hydrogen) and React Router.

## Stack

- Hydrogen 2026.4
- React Router 7
- TypeScript
- Tailwind CSS v4
- mock.shop (default data source)

## Requirements

- Node.js 22 or 24

## Local development

```bash
npm install
npm run dev
```

Open the URL printed in your terminal (typically `http://localhost:3000`).

## Connect to your Shopify store

By default the app uses mock.shop product data. To wire up the real Dilettante store:

```bash
npx shopify hydrogen link
npx shopify hydrogen env pull
```

Restart the dev server after pulling environment variables.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server with GraphQL codegen |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |

## Security

**Never commit these files:**

- `.env` — contains `SESSION_SECRET` and Storefront API tokens after linking
- `.shopify/` — contains your linked store identity (domain, email)

Both are in `.gitignore`. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET` before deploying (not the scaffold default `foobar`).

## Branding

Typography and color tokens are aligned with the Liquid theme:

- **Headings:** IBM Plex Sans Condensed
- **Body:** IBM Plex Mono
- **Palette:** black-on-white, 14px body, 14px button radius

Fonts load from Google Fonts in `app/root.tsx`. Design tokens live in `app/styles/tailwind.css` and `app/styles/app.css`.

## Deploy

```bash
npx shopify hydrogen deploy
```

See [Hydrogen deployment docs](https://shopify.dev/docs/storefronts/headless/hydrogen/deployments).
