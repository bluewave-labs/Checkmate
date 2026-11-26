import { z } from "zod";
import { checkErrorInfoSchema } from "@/domain/checks/check.schema.js";

const nullableNumber = z.number().nullable();
const nullableString = z.string().nullable();

export const hardwareMetricsLatestSchema = z.object({
	checkedAt: z.string(),
	host: z.object({
		os: nullableString,
		platform: nullableString,
		kernelVersion: nullableString,
		prettyName: nullableString,
	}),
	capture: z.object({
		version: nullableString,
		mode: nullableString,
	}),
	cpu: z.object({
		physicalCore: nullableNumber,
		logicalCore: nullableNumber,
		frequency: nullableNumber,
		currentFrequency: nullableNumber,
		usage: nullableNumber,
		temperature: z.array(z.number()).nullable(),
	}),
	memory: z.object({
		totalBytes: nullableNumber,
		usedBytes: nullableNumber,
		availableBytes: nullableNumber,
		usage: nullableNumber,
	}),
	errors: z.array(checkErrorInfoSchema),
});

export const hardwareMetricsBucketSchema = z.object({
	bucketDate: z.string(),
	cpu: z.object({
		usage: nullableNumber,
		currentFrequency: nullableNumber,
		temperature: z.array(nullableNumber),
	}),
	memory: z.object({
		usedBytes: nullableNumber,
		availableBytes: nullableNumber,
		usage: nullableNumber,
	}),
});

export const hardwareMetricsDiskBucketSchema = z.object({
	bucketDate: z.string(),
	usedBytes: nullableNumber,
	freeBytes: nullableNumber,
	usage: nullableNumber,
	usedInodes: nullableNumber,
	freeInodes: nullableNumber,
	inodesUsage: nullableNumber,
	readBytesPerSecond: nullableNumber,
	writeBytesPerSecond: nullableNumber,
	readTimeFraction: nullableNumber,
	writeTimeFraction: nullableNumber,
});

export const hardwareMetricsDiskSchema = z.object({
	device: z.string(),
	mountpoint: z.string(),
	latest: z
		.object({
			totalBytes: nullableNumber,
			usedBytes: nullableNumber,
			freeBytes: nullableNumber,
			usage: nullableNumber,
			totalInodes: nullableNumber,
			usedInodes: nullableNumber,
			freeInodes: nullableNumber,
			inodesUsage: nullableNumber,
		})
		.nullable(),
	buckets: z.array(hardwareMetricsDiskBucketSchema),
});

export const hardwareMetricsInterfaceBucketSchema = z.object({
	bucketDate: z.string(),
	bytesSentPerSecond: nullableNumber,
	bytesRecvPerSecond: nullableNumber,
	packetsSentPerSecond: nullableNumber,
	packetsRecvPerSecond: nullableNumber,
	errIn: nullableNumber,
	errOut: nullableNumber,
	dropIn: nullableNumber,
	dropOut: nullableNumber,
	fifoIn: nullableNumber,
	fifoOut: nullableNumber,
});

export const hardwareMetricsInterfaceSchema = z.object({
	name: z.string(),
	buckets: z.array(hardwareMetricsInterfaceBucketSchema),
});

export const hardwareMetricsSchema = z.object({
	checks: z.object({
		total: z.number(),
		up: z.number(),
	}),
	latest: hardwareMetricsLatestSchema.nullable(),
	buckets: z.array(hardwareMetricsBucketSchema),
	disks: z.array(hardwareMetricsDiskSchema),
	interfaces: z.array(hardwareMetricsInterfaceSchema),
});
