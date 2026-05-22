// Copies external sources into the Astro project tree so the build is
// self-contained. Required because Vercel's "Root Directory" setting
// only uploads the docs/api/ subtree, leaving sibling/parent paths
// (server/openapi.json, docs/api-content/) outside the build context.
//
// Run automatically by predev / prebuild via package.json. If the
// external paths exist, they win; otherwise we assume the files were
// already vendored (e.g. by a previous run) and continue.

import { existsSync, mkdirSync, cpSync, copyFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const REPO_ROOT = join(PROJECT_ROOT, "..", "..");

const SOURCES = [
	{
		// Markdown prose (the public docs content).
		from: join(REPO_ROOT, "docs", "api-content"),
		to: join(PROJECT_ROOT, "src", "vendored", "api-content"),
		kind: "dir",
	},
	{
		// OpenAPI spec — read at build time by starlight-openapi.
		from: join(REPO_ROOT, "server", "openapi.json"),
		to: join(PROJECT_ROOT, "src", "vendored", "openapi.json"),
		kind: "file",
	},
];

let synced = 0;
for (const src of SOURCES) {
	if (!existsSync(src.from)) {
		if (existsSync(src.to)) {
			console.log(`[sync-sources] ${src.from} not present; using existing vendored copy.`);
			continue;
		}
		console.error(`[sync-sources] ERROR: source missing and no vendored copy: ${src.from}`);
		process.exit(1);
	}

	mkdirSync(dirname(src.to), { recursive: true });
	if (src.kind === "dir") {
		cpSync(src.from, src.to, { recursive: true });
	} else {
		copyFileSync(src.from, src.to);
	}
	const stat = statSync(src.from);
	console.log(`[sync-sources] ${src.from} → ${src.to} (${stat.isDirectory() ? "dir" : `${stat.size} bytes`})`);
	synced++;
}

console.log(`[sync-sources] OK (${synced} sources copied)`);
