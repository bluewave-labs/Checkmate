import { z } from "zod";
import { MonitorTypes } from "@/domain/monitors/monitor.type.js";
import { EgressStatuses } from "@/domain/egress/egress.type.js";
import { dockerContainerInfoSchema, dockerContainerSummarySchema } from "@/domain/docker/docker.schema.js";

export const checkMetadataSchema = z.object({
	monitorId: z.string(),
	teamId: z.string(),
	type: z.enum(MonitorTypes),
});

export const checkTimingsSchema = z.object({
	start: z.number(),
	socket: z.number().optional(),
	lookup: z.number().optional(),
	connect: z.number().optional(),
	secureConnect: z.number().optional(),
	upload: z.number().optional(),
	response: z.number().optional(),
	end: z.number().optional(),
	phases: z.object({
		wait: z.number().optional(),
		dns: z.number().optional(),
		tcp: z.number().optional(),
		tls: z.number().optional(),
		request: z.number().optional(),
		firstByte: z.number().optional(),
		download: z.number().optional(),
		total: z.number().optional(),
	}),
});

export const checkCpuInfoSchema = z.object({
	physical_core: z.number().optional(),
	logical_core: z.number().optional(),
	frequency: z.number().optional(),
	current_frequency: z.number().optional(),
	temperature: z.array(z.number()).optional(),
	free_percent: z.number().optional(),
	usage_percent: z.number().optional(),
});

export const checkMemoryInfoSchema = z.object({
	total_bytes: z.number().optional(),
	available_bytes: z.number().optional(),
	used_bytes: z.number().optional(),
	usage_percent: z.number().optional(),
});

export const checkHostInfoSchema = z.object({
	os: z.string().optional(),
	platform: z.string().optional(),
	kernel_version: z.string().optional(),
	pretty_name: z.string().optional(),
});

export const checkCaptureInfoSchema = z.object({
	version: z.string().optional(),
	mode: z.string().optional(),
});

export const checkDiskInfoSchema = z.object({
	device: z.string().optional(),
	mountpoint: z.string().optional(),
	total_bytes: z.number().optional(),
	free_bytes: z.number().optional(),
	used_bytes: z.number().optional(),
	usage_percent: z.number().optional(),
	total_inodes: z.number().optional(),
	free_inodes: z.number().optional(),
	used_inodes: z.number().optional(),
	inodes_usage_percent: z.number().optional(),
	read_bytes: z.number().optional(),
	write_bytes: z.number().optional(),
	read_time: z.number().optional(),
	write_time: z.number().optional(),
});

export const checkErrorInfoSchema = z.object({
	metric: z.array(z.string()),
	err: z.string(),
});

export const checkNetworkInterfaceInfoSchema = z.object({
	name: z.string(),
	bytes_sent: z.number(),
	bytes_recv: z.number(),
	packets_sent: z.number(),
	packets_recv: z.number(),
	err_in: z.number(),
	err_out: z.number(),
	drop_in: z.number(),
	drop_out: z.number(),
	fifo_in: z.number(),
	fifo_out: z.number(),
});

export const lighthouseAuditSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	score: z.number().nullable().optional(),
	displayValue: z.string().optional(),
	numericValue: z.number().optional(),
	numericUnit: z.string().optional(),
});

export const checkAuditsSchema = z.object({
	cls: lighthouseAuditSchema.optional(),
	si: lighthouseAuditSchema.optional(),
	fcp: lighthouseAuditSchema.optional(),
	lcp: lighthouseAuditSchema.optional(),
	tbt: lighthouseAuditSchema.optional(),
});

export const checkSchema = z
	.object({
		id: z.string(),
		metadata: checkMetadataSchema,
		status: z.boolean(),
		responseTime: z.number(),
		timings: checkTimingsSchema.optional(),
		statusCode: z.number(),
		message: z.string(),
		cpu: checkCpuInfoSchema.optional(),
		memory: checkMemoryInfoSchema.optional(),
		disk: z.array(checkDiskInfoSchema).optional(),
		host: checkHostInfoSchema.optional(),
		errors: z.array(checkErrorInfoSchema).optional(),
		capture: checkCaptureInfoSchema.optional(),
		containers: z.array(dockerContainerInfoSchema).optional(),
		containerSummary: dockerContainerSummarySchema.optional(),
		net: z.array(checkNetworkInterfaceInfoSchema).optional(),
		accessibility: z.number().optional(),
		bestPractices: z.number().optional(),
		seo: z.number().optional(),
		performance: z.number().optional(),
		audits: checkAuditsSchema.optional(),
		// Set on failing checks while the egress check is enabled; absent otherwise.
		// "degraded": no reliability target was reachable (or the instance was already degraded), so the failure is not attributable to the target.
		// "ok": a reliability target was reachable.
		egressStatus: z.enum(EgressStatuses).optional(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.meta({ id: "Check" });

export const checkSnapshotSchema = checkSchema
	.pick({
		// uptime charts and down check tooltips
		id: true,
		status: true,
		responseTime: true,
		statusCode: true,
		message: true,
		createdAt: true,
		// pagespeed
		accessibility: true,
		bestPractices: true,
		seo: true,
		performance: true,
		audits: true,
	})
	.extend({
		// hardware monitors only
		cpu: checkCpuInfoSchema
			.pick({ physical_core: true, logical_core: true, frequency: true, current_frequency: true, temperature: true, usage_percent: true })
			.optional(),
		memory: checkMemoryInfoSchema.pick({ total_bytes: true, used_bytes: true, usage_percent: true }).optional(),
		disk: z.array(checkDiskInfoSchema.pick({ device: true, total_bytes: true, used_bytes: true, usage_percent: true })).optional(),
		host: checkHostInfoSchema.pick({ os: true, platform: true, pretty_name: true }).optional(),
		// docker only
		containerSummary: dockerContainerSummarySchema.optional(),
	});

export const checksPageSchema = z.object({
	checksCount: z.number(),
	checks: z.array(checkSchema),
});

export const checksSummarySchema = z.object({
	totalChecks: z.number(),
	downChecks: z.number(),
});
