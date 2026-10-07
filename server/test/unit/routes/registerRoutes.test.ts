import { describe, expect, it } from "@jest/globals";
import { OpenAPIRegistry, type RouteConfig } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registerRoutes } from "../../../openapi/registerRoutes.ts";
import type { RouteTable } from "../../../src/api/routes/defineRoutes.ts";
import { bearer, errorJson } from "../../../src/api/routes/openapiHelpers.ts";
import { statusPageErrors } from "../../../src/domain/status-pages/status-page.errors.ts";

type Controller = { list: unknown; create: unknown; read: unknown; resolve: unknown };

const setup = () => {
	const registry = new OpenAPIRegistry();
	const routesOf = () => registry.definitions.filter((d) => d.type === "route").map((d) => (d as { route: RouteConfig }).route);
	return { registry, routesOf };
};

const responsesOf = (route: RouteConfig) => Object.keys(route.responses);

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

	it("derives the error set from the guards each entry installs", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "post", path: "/", handler: "create", summary: "Create", roles: ["admin"], body: z.object({ name: z.string() }) },
				{ method: "post", path: "/logo", handler: "create", summary: "Upload", upload: "logo", body: z.object({}) },
				{ method: "get", path: "/resolve", handler: "resolve", summary: "Resolve", auth: "none" },
				{ method: "get", path: "/:url", handler: "read", summary: "Public", auth: "statusPage", params: z.object({ url: z.string() }) },
			],
		};

		registerRoutes(registry, table);

		const [list, create, upload, open, publicPage] = routesOf();
		expect(responsesOf(list)).toEqual(["200", "401", "429", "500"]);
		expect(responsesOf(create)).toEqual(["200", "400", "401", "403", "429", "500"]);
		expect(responsesOf(upload)).toEqual(["200", "400", "401", "413", "415", "429", "500"]);
		expect(responsesOf(open)).toEqual(["200", "429", "500"]);
		expect(responsesOf(publicPage)).toEqual(["200", "400", "401", "404", "429", "500"]);
		expect(open.responses["500"]).toEqual(errorJson("Internal server error"));
	});

	it("adds the entry's definitions to the derived set and merges descriptions that share a status", () => {
		const { registry, routesOf } = setup();
		const nameEmpty = { status: 400, description: "Name may not be empty" };
		const notFound = { status: 404, description: "Thing not found" };
		const nameTaken = { status: 409, description: "Name already in use" };
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{
					method: "patch",
					path: "/:id",
					handler: "create",
					summary: "Edit",
					params: z.object({ id: z.string() }),
					errors: [nameEmpty, notFound, nameTaken],
				},
			],
		};

		registerRoutes(registry, table);

		const [edit] = routesOf();
		expect(responsesOf(edit)).toEqual(["200", "400", "401", "404", "409", "429", "500"]);
		expect(edit.responses["400"]).toEqual(errorJson("Invalid request, or name may not be empty"));
		expect(edit.responses["404"]).toEqual(errorJson("Thing not found"));
		expect(edit.responses["409"]).toEqual(errorJson("Name already in use"));
	});

	it("describes a definition once when the entry lists one its guard already produces", () => {
		const { registry, routesOf } = setup();
		const table: RouteTable<Controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{
					method: "get",
					path: "/:url",
					handler: "read",
					summary: "Public",
					auth: "statusPage",
					params: z.object({ url: z.string() }),
					errors: [statusPageErrors.unpublished, statusPageErrors.notFound],
				},
			],
		};

		registerRoutes(registry, table);

		const [publicPage] = routesOf();
		expect(responsesOf(publicPage)).toEqual(["200", "400", "401", "403", "404", "429", "500"]);
		expect(publicPage.responses["404"]).toEqual(errorJson("Status page not found"));
		expect(publicPage.responses["403"]).toEqual(errorJson("Status page is unpublished and the caller is not on its team"));
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
		expect(responsesOf(registered)).toEqual(["200", "401", "409", "429", "500"]);
		expect(registered.responses["409"]).toEqual({ description: "In use" });
	});
});
