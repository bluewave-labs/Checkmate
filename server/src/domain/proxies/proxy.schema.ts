import { z } from "zod";
import { ProxyProtocols } from "./proxy.type.js";

export const proxySchema = z.object({
	id: z.string(),
	teamId: z.string(),
	name: z.string(),
	protocol: z.enum(ProxyProtocols),
	host: z.string(),
	port: z.number(),
	username: z.string().optional(),
	password: z.string().optional(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const proxyResponseSchema = proxySchema.omit({ password: true }).extend({ hasPassword: z.boolean() }).meta({ id: "Proxy" });

export const proxySummarySchema = proxySchema.pick({ id: true, name: true, host: true, port: true });
