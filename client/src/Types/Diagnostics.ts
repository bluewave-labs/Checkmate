export interface Diagnostics {
	osStats: OsStats;
	cpuUsage: CpuUsage;
	v8HeapStats: V8HeapStats;
	eventLoopDelayMs: number;
	uptimeMs: number;
	mongoStats: MongoStats;
}

export interface OsStats {
	totalMemoryBytes: number;
}

export interface CpuUsage {
	usagePercentage: number;
}

export interface V8HeapStats {
	totalHeapSizeBytes: number;
	usedHeapSizeBytes: number;
	heapSizeLimitBytes: number;
}

export interface MongoStats {
	readyState: number;
	host: string;
	port: number;
	dbName: string;
	totalSize: number;
	collections: CollectionStats[];
}

export interface CollectionStats {
	name: string;
	documentCount: number;
	storageSize: number;
	totalIndexSize: number;
	totalSize: number;
	bucketCount?: number;
}
