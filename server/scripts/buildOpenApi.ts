import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOpenApiSpec } from "../openapi/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.resolve(__dirname, "..", "openapi.json");

writeFileSync(outPath, JSON.stringify(getOpenApiSpec(), null, 2) + "\n");
console.log(`OpenAPI spec written to ${outPath}`);
