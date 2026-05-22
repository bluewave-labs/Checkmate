import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import starlightOpenAPI, { openAPISidebarGroups } from "starlight-openapi";

// The OpenAPI spec lives in the server package. The Starlight integration
// reads it at build time and generates the full /api/reference/* tree.
const OPENAPI_PATH = "../../server/openapi.json";

export default defineConfig({
  // Served at https://checkmate.so/docs — the leading slash is included so
  // every internal link resolves correctly when fronted by a reverse proxy.
  base: "/docs",
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

      sidebar: [
        {
          label: "Getting started",
          items: [
            { label: "Introduction", slug: "introduction" },
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
