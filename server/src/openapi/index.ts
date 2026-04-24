import "./registry.js";
import "./routes/monitor.js";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import type { JsonObject } from "swagger-ui-express";
import { registry } from "./registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cached: JsonObject | null = null;

export function getOpenApiSpec(): JsonObject {
	if (cached) return cached;

	const staticSpec = JSON.parse(fs.readFileSync(path.join(__dirname, "../../openapi.json"), "utf8")) as Record<string, unknown>;

	const generator = new OpenApiGeneratorV3(registry.definitions);
	const generated = generator.generateDocument({
		openapi: "3.0.0",
		info: { title: "generated", version: "0.0.0" },
	});

	const generatedPaths = (generated.paths ?? {}) as Record<string, unknown>;
	const generatedSchemas = (generated.components?.schemas ?? {}) as Record<string, unknown>;
	const generatedSecuritySchemes = (generated.components?.securitySchemes ?? {}) as Record<string, unknown>;

	const staticPaths = (staticSpec.paths ?? {}) as Record<string, unknown>;
	const staticComponents = (staticSpec.components ?? {}) as Record<string, unknown>;
	const staticSchemas = (staticComponents.schemas ?? {}) as Record<string, unknown>;
	const staticSecuritySchemes = (staticComponents.securitySchemes ?? {}) as Record<string, unknown>;

	// Drop static paths that the registry now owns, plus stale entries
	// for routes that no longer exist in the codebase.
	const owned = new Set(Object.keys(generatedPaths));
	const stale = new Set(["/monitors/bulk", "/monitors/test-email"]);
	const filteredStaticPaths = Object.fromEntries(Object.entries(staticPaths).filter(([key]) => !owned.has(key) && !stale.has(key)));

	cached = {
		...staticSpec,
		paths: { ...filteredStaticPaths, ...generatedPaths },
		components: {
			...staticComponents,
			schemas: { ...staticSchemas, ...generatedSchemas },
			securitySchemes: { ...staticSecuritySchemes, ...generatedSecuritySchemes },
		},
	};

	return cached;
}
