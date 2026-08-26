import { z } from "zod";
import { ProxyProtocols } from "@/Types/Proxy";

export const proxySchema = z.object({
	name: z.string().min(1, "Proxy name is required"),
	protocol: z.enum(ProxyProtocols, "Invalid proxy protocol"),
	host: z.string().min(1, "Proxy host is required"),
	port: z
		.number()
		.int()
		.min(1, "Proxy port is required")
		.max(65535, "Proxy port must be between 1 and 65535"),
	username: z.string().optional(),
	password: z.string().optional(),
});

export type ProxyFormData = z.infer<typeof proxySchema>;
