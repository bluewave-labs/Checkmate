import { describe, expect, it } from "@jest/globals";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guardErrors } from "../../../openapi/registerRoutes.ts";
import type { RouteTable } from "../../../src/api/routes/defineRoutes.ts";
import type { ErrorDefinition } from "../../../src/utils/AppError.ts";
import { createThrowScanner, definitionId, type ThrowSite } from "../../helpers/throwScanner.ts";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const routesDir = "src/api/routes";
const controllersDir = "src/api/controllers";

const scanner = createThrowScanner(serverRoot);

const isDefinition = (value: unknown): value is ErrorDefinition =>
	typeof value === "object" &&
	value !== null &&
	typeof (value as ErrorDefinition).status === "number" &&
	typeof (value as ErrorDefinition).description === "string";

/** Every definition the server exports, keyed by reference and named the way a throw site spells it. */
const loadDefinitionNames = async (): Promise<Map<ErrorDefinition, string>> => {
	const catalogs = readdirSync(path.join(serverRoot, "src"), { recursive: true })
		.map(String)
		.filter((file) => file.endsWith(".errors.ts"))
		.map((file) => path.join("src", file));
	const names = new Map<ErrorDefinition, string>();
	for (const file of [...catalogs, "src/utils/AppError.ts"].sort()) {
		const module = (await import(`../../../${file}`)) as Record<string, unknown>;
		for (const [exportName, value] of Object.entries(module)) {
			if (isDefinition(value)) {
				names.set(value, definitionId(file, exportName));
			} else if (typeof value === "object" && value !== null) {
				for (const [key, definition] of Object.entries(value)) {
					if (isDefinition(definition)) names.set(definition, definitionId(file, `${exportName}.${key}`));
				}
			}
		}
	}
	return names;
};

type Resource = { name: string; table: RouteTable<Record<string, unknown>> };

const loadResources = async (): Promise<Resource[]> => {
	const files = readdirSync(path.join(serverRoot, routesDir))
		.filter((file) => file !== "defineRoutes.ts" && file.endsWith("Routes.ts"))
		.sort();
	return Promise.all(
		files.map(async (file) => {
			const module = (await import(`../../../${routesDir}/${file}`)) as Record<string, RouteTable<Record<string, unknown>>>;
			const table = Object.values(module)[0];
			if (!table) throw new Error(`${file} exports no route table`);
			return { name: file.replace(/Routes\.ts$/, ""), table };
		})
	);
};

type RouteReport = { label: string; documented: string[]; listed: string[]; thrown: ThrowSite[] };

const reportsFor = (names: Map<ErrorDefinition, string>, { name, table }: Resource): RouteReport[] =>
	table.routes.map((route) => {
		const label = `${route.method.toUpperCase()} ${table.prefix}${route.path} (${name}.${route.handler})`;
		const nameOf = (definition: ErrorDefinition): string => {
			const found = names.get(definition);
			if (!found) throw new Error(`${label} lists a definition no catalog exports: ${definition.description}`);
			return found;
		};
		const listed = (route.errors ?? []).map(nameOf);
		return {
			label,
			documented: [...guardErrors(route, route.auth ?? table.auth).map(nameOf), ...listed],
			listed,
			thrown: scanner.throwSitesOf(`${controllersDir}/${name}Controller.ts`, route.handler),
		};
	});

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const loadReports = async (): Promise<RouteReport[]> => {
	const names = await loadDefinitionNames();
	return (await loadResources()).flatMap((resource) => reportsFor(names, resource));
};

describe("route error documentation", () => {
	it("documents every error definition a handler can throw", async () => {
		const reports = await loadReports();

		const undocumented = reports.flatMap(({ label, documented, thrown }) =>
			unique(thrown.map((site) => site.definition))
				.filter((definition) => !documented.includes(definition))
				.map((definition) => {
					const sites = unique(thrown.filter((site) => site.definition === definition).map((site) => site.location));
					return `${label} can throw ${definition} (${sites.join(", ")}) but does not list it`;
				})
		);

		expect(undocumented).toEqual([]);
	});

	it("lists only definitions reachable from the handler", async () => {
		const reports = await loadReports();

		const stale = reports.flatMap(({ label, listed, thrown }) => {
			const reachable = new Set(thrown.map((site) => site.definition));
			return listed
				.filter((definition) => !reachable.has(definition))
				.map((definition) => `${label} lists ${definition} but nothing reachable from the handler throws it`);
		});

		expect(stale).toEqual([]);
	});
});
