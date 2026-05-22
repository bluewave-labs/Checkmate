import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";

// The OpenAPI spec is vendored from server/openapi.json by
// scripts/sync-sources.mjs (runs as predev/prebuild). We point at the
// vendored copy so the build is self-contained — Vercel only uploads
// the docs/api/ subtree, so paths outside this directory are not
// available at build time.
const OPENAPI_PATH = "./src/vendored/openapi.json";

export default defineConfig({
  // The deployed site serves at the root of its Vercel domain. The
  // reverse proxy that maps checkmate.so/docs/* → Vercel must strip
  // the /docs/ prefix before forwarding (the Cloudflare Worker snippet
  // in docs/api-content/README.md does this).
  site: "https://checkmate.so",

  integrations: [
    starlight({
      title: "Checkmate API",
      description: "Use the Checkmate REST API to manage monitors, incidents, status pages, notifications, and users programmatically.",

      // Prose markdown is loaded from /docs/api-content via the custom
      // docsLoader in src/content.config.ts. Keeping content outside the
      // Astro project tree means contributors can edit it without dealing
      // with Astro / Starlight tooling.

      logo: {
        src: "./src/assets/logo.svg",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/checkmate.css"],

      social: {
        github: "https://github.com/bluewave-labs/Checkmate",
      },

      // Inject a "Releases" link into the site header.
      components: {
        SocialIcons: "./src/components/HeaderLinks.astro",
      },

      sidebar: [
        {
          label: "Getting started",
          items: [
            { label: "Introduction", slug: "" },
            { label: "Quickstart", slug: "quickstart" },
            { label: "Authentication", slug: "authentication" },
          ],
        },
        {
          label: "Core concepts",
          items: [
            { label: "Conventions", slug: "conventions" },
            { label: "Errors", slug: "errors" },
            { label: "Rate limiting", slug: "rate-limiting" },
          ],
        },
        {
          label: "API reference",
          items: [
            { label: "Overview", slug: "api-reference/overview" },
            // The OpenAPI plugin appends every endpoint under this group.
            ...openAPISidebarGroups,
          ],
        },
      ],

      plugins: [
        starlightOpenAPI([
          {
            base: "api-reference",
            label: "REST API",
            schema: OPENAPI_PATH,
          },
        ]),
      ],
    }),
  ],
});
