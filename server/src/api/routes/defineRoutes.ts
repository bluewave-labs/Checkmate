import type { ZodType, ZodObject } from "zod";
import type { UserRole } from "@/domain/users/user.type.js";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";

export type Method = "get" | "post" | "put" | "patch" | "delete";
export type Auth = "jwt" | "statusPage" | "none";

export type RouteDef<C> = {
	method: Method;
	path: string;
	handler: keyof C & string; // a method name on the controller interface
	summary: string;
	auth?: Auth;
	roles?: UserRole[];
	upload?: string; // multer field name; body is documented as multipart
	params?: ZodObject;
	query?: ZodObject;
	body?: ZodType;
	response?: ZodType; // data schema; absent = okJsonNoData
	spec?: (derived: RouteConfig) => RouteConfig;
};

export type RouteTable<C> = {
	prefix: string; // eg "/tags" mounted under /api/v1
	tag: string; // OpenAPI tag
	auth: Auth; // "jwt" = verifyJWT middleware
	routes: readonly RouteDef<C>[];
};
