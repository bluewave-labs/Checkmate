/**
 * Locale Migration Script
 *
 * Restructures all non-English locale files to match en.json's nested key structure.
 * Recovers translations via safe key-matching strategies, uses English placeholders
 * for unmatched keys.
 *
 * Usage: npx tsx client/scripts/migrate-locales.ts
 *
 * SAFETY: en.json is NEVER modified. Originals are backed up before overwriting.
 */

import fs from "fs";
import path from "path";

const LOCALES_DIR = path.resolve(import.meta.dirname, "../src/locales");
const BACKUP_DIR = path.join(LOCALES_DIR, "backup");
const REPORT_PATH = path.join(LOCALES_DIR, "migration-report.json");

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten a nested object into { "a.b.c": value } pairs */
function flattenKeys(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(obj)) {
		const fullPath = prefix ? `${prefix}.${key}` : key;
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			Object.assign(result, flattenKeys(value as Record<string, unknown>, fullPath));
		} else {
			result[fullPath] = String(value);
		}
	}
	return result;
}

/** Set a value at a dot-separated path in a nested object */
function setNestedValue(obj: Record<string, unknown>, keyPath: string, value: string): void {
	const parts = keyPath.split(".");
	let current = obj;
	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!(part in current) || typeof current[part] !== "object") {
			current[part] = {};
		}
		current = current[part] as Record<string, unknown>;
	}
	current[parts[parts.length - 1]] = value;
}

// ── Build mapping indexes from en.json ───────────────────────────────────────

function buildIndexes(enFlat: Record<string, string>) {
	const enKeys = Object.keys(enFlat);

	// last segment -> en key paths
	const lastSegIndex: Record<string, string[]> = {};
	// last 2 segments -> en key paths
	const suffixIndex: Record<string, string[]> = {};

	for (const keyPath of enKeys) {
		const parts = keyPath.split(".");
		const lastSeg = parts[parts.length - 1].toLowerCase();
		if (!lastSegIndex[lastSeg]) lastSegIndex[lastSeg] = [];
		lastSegIndex[lastSeg].push(keyPath);

		if (parts.length >= 2) {
			const suffix = parts.slice(-2).join(".").toLowerCase();
			if (!suffixIndex[suffix]) suffixIndex[suffix] = [];
			suffixIndex[suffix].push(keyPath);
		}
	}

	return { lastSegIndex, suffixIndex };
}

// ── Mapping logic ────────────────────────────────────────────────────────────

type MatchStrategy = "exact" | "suffix-2" | "unique-name" | "english-placeholder";

interface KeyMatch {
	enKey: string;
	value: string;
	strategy: MatchStrategy;
}

function buildMigratedLocale(
	enFlat: Record<string, string>,
	langFlat: Record<string, string>,
	indexes: ReturnType<typeof buildIndexes>
): { matches: KeyMatch[]; result: Record<string, unknown> } {
	const { lastSegIndex, suffixIndex } = indexes;
	const matches: KeyMatch[] = [];
	const result: Record<string, unknown> = {};

	// Build reverse lookup: for each orphan key in lang, index by last segment and suffix
	const langByLastSeg: Record<string, { key: string; value: string }[]> = {};
	const langBySuffix: Record<string, { key: string; value: string }[]> = {};

	for (const [langKey, langValue] of Object.entries(langFlat)) {
		const parts = langKey.split(".");
		const lastSeg = parts[parts.length - 1].toLowerCase();
		if (!langByLastSeg[lastSeg]) langByLastSeg[lastSeg] = [];
		langByLastSeg[lastSeg].push({ key: langKey, value: langValue });

		if (parts.length >= 2) {
			const suffix = parts.slice(-2).join(".").toLowerCase();
			if (!langBySuffix[suffix]) langBySuffix[suffix] = [];
			langBySuffix[suffix].push({ key: langKey, value: langValue });
		}
	}

	for (const enKey of Object.keys(enFlat)) {
		const enValue = enFlat[enKey];
		const parts = enKey.split(".");
		const lastSeg = parts[parts.length - 1].toLowerCase();
		const suffix = parts.length >= 2 ? parts.slice(-2).join(".").toLowerCase() : null;

		// Strategy 1: Exact path match
		if (langFlat[enKey] !== undefined) {
			const value = langFlat[enKey];
			setNestedValue(result, enKey, value);
			matches.push({ enKey, value, strategy: "exact" });
			continue;
		}

		// Strategy 2: 2-segment suffix match (lang key suffix matches en key suffix, both unique)
		if (suffix) {
			const enCandidates = suffixIndex[suffix];
			const langCandidates = langBySuffix[suffix];
			if (enCandidates && enCandidates.length === 1 && langCandidates && langCandidates.length === 1) {
				const value = langCandidates[0].value;
				setNestedValue(result, enKey, value);
				matches.push({ enKey, value, strategy: "suffix-2" });
				continue;
			}
		}

		// Strategy 3: Unique last-segment match
		const enCandidates = lastSegIndex[lastSeg];
		const langCandidates = langByLastSeg[lastSeg];
		if (enCandidates && enCandidates.length === 1 && langCandidates && langCandidates.length === 1) {
			const value = langCandidates[0].value;
			setNestedValue(result, enKey, value);
			matches.push({ enKey, value, strategy: "unique-name" });
			continue;
		}

		// No match — use English placeholder
		setNestedValue(result, enKey, enValue);
		matches.push({ enKey, value: enValue, strategy: "english-placeholder" });
	}

	return { matches, result };
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
	// Load en.json
	const enPath = path.join(LOCALES_DIR, "en.json");
	const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
	const enFlat = flattenKeys(en);
	const enKeyCount = Object.keys(enFlat).length;
	const indexes = buildIndexes(enFlat);

	console.log(`English: ${enKeyCount} keys (source of truth — NOT modified)\n`);

	// Find all non-English locale files
	const localeFiles = fs
		.readdirSync(LOCALES_DIR)
		.filter((f: string) => f.endsWith(".json") && f !== "en.json" && f !== "migration-report.json");

	if (localeFiles.length === 0) {
		console.log("No locale files to migrate.");
		return;
	}

	// Create backup directory
	if (!fs.existsSync(BACKUP_DIR)) {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });
	}

	const report: Record<
		string,
		{ total: number; exact: number; suffix: number; uniqueName: number; placeholder: number }
	> = {};

	for (const file of localeFiles) {
		const lang = file.replace(".json", "");
		const filePath = path.join(LOCALES_DIR, file);

		// Backup original
		const backupPath = path.join(BACKUP_DIR, file);
		fs.copyFileSync(filePath, backupPath);

		// Load and flatten
		const langData = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const langFlat = flattenKeys(langData);

		// Migrate
		const { matches, result } = buildMigratedLocale(enFlat, langFlat, indexes);

		// Write migrated file
		fs.writeFileSync(filePath, JSON.stringify(result, null, "\t") + "\n", "utf8");

		// Compute stats
		const stats = {
			total: enKeyCount,
			exact: matches.filter((m) => m.strategy === "exact").length,
			suffix: matches.filter((m) => m.strategy === "suffix-2").length,
			uniqueName: matches.filter((m) => m.strategy === "unique-name").length,
			placeholder: matches.filter((m) => m.strategy === "english-placeholder").length,
		};
		report[lang] = stats;

		const translated = stats.exact + stats.suffix + stats.uniqueName;
		const pct = ((translated / enKeyCount) * 100).toFixed(1);
		console.log(
			`${lang.padEnd(8)} ${String(translated).padStart(4)} translated (${pct}%)  |  ` +
				`exact: ${stats.exact}  suffix: ${stats.suffix}  name: ${stats.uniqueName}  ` +
				`placeholder: ${stats.placeholder}`
		);
	}

	// Write report
	fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, "\t") + "\n", "utf8");

	const totalLangs = localeFiles.length;
	console.log(`\nMigrated ${totalLangs} locale files. Originals backed up to locales/backup/`);
	console.log(`Report written to ${REPORT_PATH}`);
}

main();
