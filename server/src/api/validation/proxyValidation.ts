import { proxyResponseSchema } from "@/domain/proxies/proxy.schema.js";
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

export const editProxyBodyValidation = createProxyBodyValidation.extend({
	clearPassword: z.boolean().optional(),
	clearUsername: z.boolean().optional(),
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

export const proxyListResponseSchema = z.array(proxyResponseSchema);
