# Checkmate API documentation

Public-facing API documentation that powers **https://checkmate.so/docs**.

The site is built with [Astro Starlight](https://starlight.astro.build/) — a static-site generator that produces a fast, modern docs site with zero JavaScript by default. Starlight is open source and self-hostable; there is no third-party account required to publish.

## Repository layout

```
docs/
├── api-content/          ← markdown prose (this folder — edit here)
│   ├── introduction.md
│   ├── quickstart.md
│   ├── authentication.md
│   ├── conventions.md
│   ├── errors.md
│   ├── rate-limiting.md
│   └── api-reference/
│       └── overview.md
└── api/                  ← Astro Starlight project (build tool — leave alone unless changing the site)
    ├── package.json
    ├── astro.config.mjs
    ├── src/content.config.ts
    └── src/styles/checkmate.css
```

**Contributors editing prose only need to touch `docs/api-content/`**. Astro's content loader picks up the markdown automatically.

The endpoint reference (every URL + schema) is **auto-generated from [`server/openapi.json`](../../server/openapi.json)** via the `starlight-openapi` plugin. Adding or changing an endpoint means updating that JSON; the public docs pick it up on the next Vercel build.

## Local preview

```bash
cd docs/api
npm install
npm run dev
```

Visit http://localhost:4321/docs. Hot-reload works for markdown changes in `docs/api-content/`.

To produce the static site:

```bash
npm run build      # outputs docs/api/dist/
npm run preview    # serve the built output locally
```

## Deploying to checkmate.so/docs

Astro Starlight builds a static site. Deploy on Vercel and reverse-proxy `checkmate.so/docs/*` to it.

### One-time Vercel setup

1. Go to https://vercel.com → New Project → import the `bluewave-labs/Checkmate` GitHub repo.
2. **Root Directory**: set to `docs/api`.
3. **Framework Preset**: Vercel auto-detects Astro from `vercel.json`.
4. **Build & Output**: leave defaults (`npm run build` → `dist/`).
5. **Production Branch**: `develop`.
6. Deploy. Vercel returns a URL like `checkmate-docs.vercel.app`.
7. Verify the site renders correctly.

The deployment auto-rebuilds on every push to `develop` and on every PR (as a preview deploy).

### Reverse-proxy /docs to Vercel

In whichever edge proxy fronts `checkmate.so`, route `/docs/*` to the Vercel deployment.

**Cloudflare Workers:**

```javascript
addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === "/docs" || url.pathname.startsWith("/docs/")) {
    const target = new URL(url.pathname, "https://checkmate-docs.vercel.app");
    target.search = url.search;
    return event.respondWith(fetch(target.toString(), event.request));
  }
});
```

**nginx:**

```nginx
location /docs/ {
    proxy_pass https://checkmate-docs.vercel.app/docs/;
    proxy_set_header Host checkmate-docs.vercel.app;
    proxy_ssl_server_name on;
}
```

The `base: "/docs"` setting in `astro.config.mjs` ensures every internal link and asset URL is prefixed correctly so the site works at `checkmate.so/docs/...` rather than the root.

## Updating the docs

| Task | What to edit |
|---|---|
| Fix a typo, clarify wording | `docs/api-content/*.md` |
| Add a new narrative page | Add the file to `docs/api-content/`, then add a `slug` entry to `astro.config.mjs` → `sidebar` |
| Fix something in the API reference | Edit `server/openapi.json` (or the route spec it's built from) — never edit the generated reference pages |
| Change branding / colors | `docs/api/src/styles/checkmate.css` |
| Change site config (title, logo, social) | `docs/api/astro.config.mjs` |

Two rules:

1. **Never hand-edit the API reference.** It's regenerated on every build. Fix the spec.
2. **Test code samples against a real instance before merging.** Wrong code in docs is worse than missing code.

## Why Astro Starlight (and not Mintlify, Docusaurus, etc.)

- **No third-party account required.** Self-hostable on any static host.
- **Best looking** of the modern docs frameworks per multiple 2026 reviews — Distr, among others, migrated away from Docusaurus specifically for Starlight's design.
- **Zero JavaScript by default.** Pages are pure HTML — fast load, perfect Lighthouse scores.
- **OpenAPI integration is first-class** via `starlight-openapi`.
- **Markdown is the source of truth.** No proprietary formats. Easy to migrate later if needed.
