import { describe, expect, it } from "@jest/globals";
import { OpenAPIRegistry, type RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerRoutes } from "../../../openapi/registerRoutes.ts";
import type { RouteTable } from "../../../src/api/routes/defineRoutes.ts";
import { bearer, standardErrors } from "../../../src/api/routes/openapiHelpers.ts";

type Controller = { list: unknown; create: unknown; read: unknown; resolve: unknown };

const setup = () => {
	const registry = new OpenAPIRegistry();
	const routesOf = () => registry.definitions.filter((d) => d.type === "route").map((d) => (d as { route: RouteConfig }).route);
	return { registry, routesOf };
};

describe("registerRoutes", () => {
	it("prefixes the path, converts :param to {param}, and strips a trailing slash", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "get", path: "/:id/child/:childId", handler: "read", summary: "Read" },
			],
		};

		registerRoutes(registry, table);

		expect(routesOf().map((r) => [r.method, r.path, r.tags, r.summary])).toEqual([
			["get", "/things", ["things"], "List"],
			["get", "/things/{id}/child/{childId}", ["things"], "Read"],
		]);
	});

	it("marks entries bearer from the table default and honours per-entry overrides", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "get", path: "/resolve", handler: "resolve", summary: "Resolve", auth: "none" },
				{ method: "get", path: "/:id", handler: "read", summary: "Read", auth: "statusPage" },
			],
		};

		registerRoutes(registry, table);

		expect(routesOf().map((r) => r.security)).toEqual([bearer, undefined, undefined]);
	});

	it("gives bearer entries the standard errors and public entries only a 500", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "get", path: "/resolve", handler: "resolve", summary: "Resolve", auth: "none" },
			],
		};

		registerRoutes(registry, table);

		const [secured, open] = routesOf();
		expect(Object.keys(secured.responses)).toEqual(["200", "401", "403", "500"]);
		expect(Object.keys(open.responses)).toEqual(["200", "500"]);
		expect(open.responses["500"]).toEqual(standardErrors["500"]);
	});

	it("documents the response as a data envelope when set and a no-data envelope when absent", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List", response: z.array(z.string()) },
				{ method: "delete", path: "/:id", handler: "read", summary: "Delete" },
			],
		};

		registerRoutes(registry, table);

		const [withData, noData] = routesOf();
		const shapeOf = (r: RouteConfig) =>
			Object.keys((r.responses["200"] as { content: Record<string, { schema: z.ZodObject }> }).content["application/json"].schema.shape);
		expect(shapeOf(withData)).toEqual(["success", "msg", "data"]);
		expect(shapeOf(noData)).toEqual(["success", "msg"]);
	});

	it("builds the request from params, query and body, as multipart when upload is set", () => {
		const { registry, routesOf } = setup();
		const params = z.object({ id: z.string() });
		const query = z.object({ range: z.string() });
		const body = z.object({ name: z.string() });
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "patch", path: "/:id", handler: "read", summary: "Edit", params, query, body },
				{ method: "post", path: "/", handler: "create", summary: "Create", upload: "logo", body },
			],
		};

		registerRoutes(registry, table);

		const [none, json, multipart] = routesOf();
		expect(none.request).toBeUndefined();
		expect(json.request?.params).toBe(params);
		expect(json.request?.query).toBe(query);
		expect(Object.keys(json.request?.body?.content ?? {})).toEqual(["application/json"]);
		expect(json.request?.body?.content["application/json"].schema).toBe(body);
		expect(Object.keys(multipart.request?.body?.content ?? {})).toEqual(["multipart/form-data"]);
		const multipartShape = (multipart.request?.body?.content["multipart/form-data"].schema as z.ZodObject).shape;
		expect(Object.keys(multipartShape)).toEqual(["name", "logo"]);
	});

	it("passes the derived config through spec and registers what it returns", () => {
		const { registry, routesOf } = setup();
		let received: RouteConfig | undefined;
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{
					method: "delete",
					path: "/:id",
					handler: "read",
					summary: "Delete",
					spec: (d) => {
						received = d;
						return { ...d, responses: { ...d.responses, "409": { description: "In use" } } };
					},
				},
			],
		};

		registerRoutes(registry, table);

		const [registered] = routesOf();
		expect(received?.path).toBe("/things/{id}");
		expect(Object.keys(registered.responses)).toEqual(["200", "401", "403", "409", "500"]);
		expect(registered.responses["409"]).toEqual({ description: "In use" });
	});
});
