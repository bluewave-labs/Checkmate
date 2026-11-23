import { z } from "zod";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";

export const checkRollupUptimeSchema = z.object({
	dnsSum: z.number(),
	tcpSum: z.number(),
	tlsSum: z.number(),
	requestSum: z.number(),
	firstByteSum: z.number(),
	downloadSum: z.number(),
});

export const checkRollupSchema = z.object({
	id: z.string(),
	monitorId: z.string(),
	teamId: z.string(),
	type: z.enum(MonitorTypes),
	bucketStart: z.string(),
	totalChecks: z.number(),
	upChecks: z.number(),
	downChecks: z.number(),
	degradedChecks: z.number(),
	responseTimeSum: z.number(),
	responseTimeCount: z.number(),
	upResponseTimeSum: z.number(),
	upResponseTimeCount: z.number(),
	downResponseTimeSum: z.number(),
	downResponseTimeCount: z.number(),
	uptime: checkRollupUptimeSchema.optional(),
	updatedAt: z.string(),
});
