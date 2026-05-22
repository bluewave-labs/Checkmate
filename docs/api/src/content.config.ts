import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Load markdown from a sibling folder so prose lives outside the Astro
// project tree. Contributors edit /docs/api-content/*.md without touching
// the build tool.
//
// Starlight's built-in docsLoader is hardcoded to src/content/docs/, so we
// use Astro's plain glob loader with a custom base and apply Starlight's
// schema on top. The collection name must remain "docs" — Starlight looks
// it up by that exact name.
export const collections = {
	docs: defineCollection({
		loader: glob({
			// Vendored from /docs/api-content/ by scripts/sync-sources.mjs.
			// This indirection keeps the build self-contained for Vercel
			// (whose Root Directory setting limits the upload to docs/api/).
			base: "./src/vendored/api-content",
			// README is contributor-facing docs (how to build the site),
			// not part of the published content.
			pattern: ["**/[^_]*.{md,mdx}", "!README.md"],
		}),
		schema: docsSchema(),
	}),
};
