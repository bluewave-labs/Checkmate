import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

// Load markdown from a sibling folder so prose lives outside the Astro
// project tree. Contributors edit /docs/api-content/*.md without touching
// the build tool.
export const collections = {
	docs: defineCollection({
		loader: docsLoader({ base: "../api-content" }),
		schema: docsSchema(),
	}),
};
