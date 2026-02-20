export interface Diagnostics {
	osStats: OsStats;
	memoryUsage: MemoryUsage;
	cpuUsage: CpuUsage;
	v8HeapStats: V8HeapStats;
	eventLoopDelayMs: number;
	uptimeMs: number;
}

export interface OsStats {
	freeMemoryBytes: number;
	totalMemoryBytes: number;
}

export interface MemoryUsage {
	rss: number;
	heapTotal: number;
	heapUsed: number;
	external: number;
	arrayBuffers: number;
}

export interface CpuUsage {
	userUsageMs: number;
	systemUsageMs: number;
	usagePercentage: number;
}

export interface V8HeapStats {
	totalHeapSizeBytes: number;
	usedHeapSizeBytes: number;
	heapSizeLimitBytes: number;
}
