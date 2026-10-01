import type { proxyResponseSchema, proxySchema, proxySummarySchema } from "@/domain/proxies/proxy.schema.js";
import type { z } from "zod";
export const ProxyProtocols = ["http", "https"] as const;
export type ProxyProtocol = (typeof ProxyProtocols)[number];

export type Proxy = z.infer<typeof proxySchema>;
export type ProxyResponse = z.infer<typeof proxyResponseSchema>;
export type ProxySummary = z.infer<typeof proxySummarySchema>;
