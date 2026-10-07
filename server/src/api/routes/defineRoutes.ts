import type { ZodType, ZodObject } from "zod";
import type { UserRole } from "@/domain/users/user.type.js";
import type { RouteConfig } from "@asteasolutions/zod-to-openapi";
import { ErrorDefinition } from "@/utils/AppError.js";

export type Method = "get" | "post" | "put" | "patch" | "delete";
export type Auth = "jwt" | "statusPage" | "none";

export type ServiceErrorStatus = 400 | 401 | 403 | 404 | 409 | 422; // 401 is for login only; every other 401 is derived from auth

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
	errors?: readonly ErrorDefinition[];
	spec?: (derived: RouteConfig) => RouteConfig;
};

export type RouteTable<C> = {
	prefix: string; // eg "/tags" mounted under /api/v1
	tag: string; // OpenAPI tag
	auth: Auth; // "jwt" = verifyJWT middleware
	routes: readonly RouteDef<C>[];
};
