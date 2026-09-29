import { Router, type RequestHandler } from "express";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { imageUpload } from "@/api/middleware/upload.js";

export type AuthMiddleware = { jwt: RequestHandler; statusPage: RequestHandler };

export const buildRouter = <C>(table: RouteTable<C>, controller: C, middleware: AuthMiddleware): Router => {
	const router = Router();
	for (const r of table.routes) {
		const auth = r.auth ?? table.auth;
		router[r.method](
			r.path,
			...(auth === "none" ? [] : [middleware[auth]]),
			...(r.roles ? [isAllowed(r.roles)] : []),
			...(r.upload ? [imageUpload.single(r.upload)] : []),
			controller[r.handler] as RequestHandler
		);
	}
	return router;
};
