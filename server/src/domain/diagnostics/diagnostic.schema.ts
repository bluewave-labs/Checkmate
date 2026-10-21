import { z } from "zod";

export const collectionDiagnosticsSchema = z.object({
	name: z.string(),
	documentCount: z.number(),
	storageSize: z.number(),
	totalIndexSize: z.number(),
	totalSize: z.number(),
	bucketCount: z.number().optional(),
});

export const mongoDiagnosticsSchema = z.object({
	readyState: z.number(),
	readsPerSecond: z.number(),
	insertsPerSecond: z.number(),
	updatesPerSecond: z.number(),
	deletesPerSecond: z.number(),
	writesPerSecond: z.number(),
	host: z.string(),
	port: z.number(),
	dbName: z.string(),
	totalSize: z.number(),
	collections: z.array(collectionDiagnosticsSchema),
});

export const diagnosticsSchema = z
	.object({
		osStats: z.object({ totalMemoryBytes: z.number() }),
		cpuUsage: z.object({ usagePercentage: z.number() }),
		v8HeapStats: z.object({
			totalHeapSizeBytes: z.number(),
			usedHeapSizeBytes: z.number(),
			heapSizeLimitBytes: z.number(),
		}),
		eventLoopDelayMs: z.number(),
		uptimeMs: z.number(),
		mongoStats: mongoDiagnosticsSchema,
	})
	.meta({ id: "Diagnostics" });
