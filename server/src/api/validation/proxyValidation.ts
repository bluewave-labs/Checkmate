import { ProxyProtocols } from "@/domain/proxies/proxy.type.js";
import { z } from "zod";

//****************************************
// Proxy Validations
//****************************************

export const createProxyBodyValidation = z.object({
	name: z.string().min(1, "Proxy name is required"),
	protocol: z.enum(ProxyProtocols, "Invalid proxy protocol"),
	host: z.string().min(1, "Proxy host is required"),
	port: z.number().int().min(1, "Proxy port is required").max(65535, "Proxy port must be between 1 and 65535"),
	username: z.string().optional(),
	password: z.string().optional(),
});

// Empty/absent password keeps doesn't delete, only clearPassword: true does.
export const editProxyBodyValidation = createProxyBodyValidation.extend({
	clearPassword: z.boolean().optional(),
});

export const getProxyByIdParamValidation = z.object({
	id: z.string().min(1, "Proxy ID is required"),
});
export const editProxyParamValidation = z.object({
	id: z.string().min(1, "Proxy ID is required"),
});
export const deleteProxyParamValidation = z.object({
	id: z.string().min(1, "Proxy ID is required"),
});

export const proxyResponseSchema = z
	.object({
		id: z.string(),
		teamId: z.string(),
		name: z.string(),
		protocol: z.enum(ProxyProtocols),
		host: z.string(),
		port: z.number(),
		username: z.string().optional(),
		hasPassword: z.boolean(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.passthrough();
