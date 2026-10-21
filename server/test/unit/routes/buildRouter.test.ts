import { describe, expect, it, jest } from "@jest/globals";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { buildRouter, type AuthMiddleware } from "../../../src/api/routes/buildRouter.ts";
import type { RouteTable } from "../../../src/api/routes/defineRoutes.ts";
import { AppError } from "../../../src/utils/AppError.ts";

type RouteLayer = { route: { path: string; methods: Record<string, boolean>; stack: { handle: RequestHandler }[] } };

const setup = () => {
	const jwt: RequestHandler = function jwt(_req, _res, next) {
		next();
	};
	const statusPage: RequestHandler = function statusPage(_req, _res, next) {
		next();
	};
	const middleware: AuthMiddleware = { jwt, statusPage };
	const controller = {
		list: function list(_req: Request, res: Response) {
			res.json({ success: true, msg: "ok" });
		},
		create: function create(_req: Request, res: Response) {
			res.json({ success: true, msg: "ok" });
		},
		resolve: function resolve(_req: Request, res: Response) {
			res.json({ success: true, msg: "ok" });
		},
		read: function read(_req: Request, res: Response) {
			res.json({ success: true, msg: "ok" });
		},
	};
	return { middleware, controller };
};

const layersOf = (router: ReturnType<typeof buildRouter>): RouteLayer[] => (router as unknown as { stack: RouteLayer[] }).stack;

describe("buildRouter", () => {
	it("registers one route per entry with the entry's method and path", () => {
		const { middleware, controller } = setup();
		const table: RouteTable<typeof controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "post", path: "/", handler: "create", summary: "Create" },
				{ method: "get", path: "/:id", handler: "read", summary: "Read" },
			],
		};

		const layers = layersOf(buildRouter(table, controller, middleware));

		expect(layers.map((l) => [Object.keys(l.route.methods)[0], l.route.path])).toEqual([
			["get", "/"],
			["post", "/"],
			["get", "/:id"],
		]);
	});

	it("installs guards in the order auth, roles, upload, then the controller method", () => {
		const { middleware, controller } = setup();
		const table: RouteTable<typeof controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [{ method: "post", path: "/", handler: "create", summary: "Create", roles: ["admin"], upload: "logo" }],
		};

		const [layer] = layersOf(buildRouter(table, controller, middleware));
		const handles = layer.route.stack.map((s) => s.handle);

		expect(handles).toHaveLength(4);
		expect(handles[0]).toBe(middleware.jwt);
		expect(handles[2].name).toBe("multerMiddleware");
		expect(handles[3]).toBe(controller.create);

		const next = jest.fn() as unknown as NextFunction;
		handles[1]({ user: { role: ["user"] } } as unknown as Request, {} as Response, next);
		const error = (next as jest.Mock).mock.calls[0][0] as AppError;
		expect(error).toBeInstanceOf(AppError);
		expect(error.status).toBe(403);
	});

	it("produces a layer with only the handler when the entry has no guards", () => {
		const { middleware, controller } = setup();
		const table: RouteTable<typeof controller> = {
			prefix: "/things",
			tag: "things",
			auth: "none",
			routes: [{ method: "get", path: "/", handler: "list", summary: "List" }],
		};

		const [layer] = layersOf(buildRouter(table, controller, middleware));

		expect(layer.route.stack.map((s) => s.handle)).toEqual([controller.list]);
	});

	it("uses the table auth by default and the entry auth where it overrides", () => {
		const { middleware, controller } = setup();
		const table: RouteTable<typeof controller> = {
			prefix: "/things",
			tag: "things",
			auth: "jwt",
			routes: [
				{ method: "get", path: "/", handler: "list", summary: "List" },
				{ method: "get", path: "/resolve", handler: "resolve", summary: "Resolve", auth: "none" },
				{ method: "get", path: "/:id", handler: "read", summary: "Read", auth: "statusPage" },
			],
		};

		const layers = layersOf(buildRouter(table, controller, middleware));

		expect(layers[0].route.stack.map((s) => s.handle)).toEqual([middleware.jwt, controller.list]);
		expect(layers[1].route.stack.map((s) => s.handle)).toEqual([controller.resolve]);
		expect(layers[2].route.stack.map((s) => s.handle)).toEqual([middleware.statusPage, controller.read]);
	});
});
