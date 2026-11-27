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

export const checkRollupSumCountSchema = z.object({
	sum: z.number(),
	count: z.number(),
});

export const checkRollupChangeSecondsSchema = z.object({
	change: z.number(),
	seconds: z.number(),
});

export const checkRollupHardwareDiskSchema = z.object({
	device: z.string(),
	mountpoint: z.string(),
	usedBytes: checkRollupSumCountSchema,
	freeBytes: checkRollupSumCountSchema,
	usage: checkRollupSumCountSchema,
	usedInodes: checkRollupSumCountSchema,
	freeInodes: checkRollupSumCountSchema,
	inodesUsage: checkRollupSumCountSchema,
	readBytes: checkRollupChangeSecondsSchema,
	writeBytes: checkRollupChangeSecondsSchema,
	readTime: checkRollupChangeSecondsSchema,
	writeTime: checkRollupChangeSecondsSchema,
});

export const checkRollupHardwareSchema = z.object({
	cpuUsage: checkRollupSumCountSchema,
	cpuCurrentFrequency: checkRollupSumCountSchema,
	memoryUsedBytes: checkRollupSumCountSchema,
	memoryAvailableBytes: checkRollupSumCountSchema,
	memoryUsage: checkRollupSumCountSchema,
	temperature: z.array(checkRollupSumCountSchema),
	disks: z.array(checkRollupHardwareDiskSchema).optional(),
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
	hardware: checkRollupHardwareSchema.optional(),
	updatedAt: z.string(),
});
