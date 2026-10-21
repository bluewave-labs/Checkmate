import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";
import { getOpenApiSpec } from "../openapi/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "..", "openapi.json");

const prettierOptions = await resolveConfig(outPath);
const formatted = await format(JSON.stringify(getOpenApiSpec(), null, 2), { ...prettierOptions, filepath: outPath });

writeFileSync(outPath, formatted);
console.log(`OpenAPI spec written to ${outPath}`);
