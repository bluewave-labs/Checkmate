import type { ConnectionStates, mongo } from "mongoose";

export interface Diagnostics {
	osStats: OsStats;
	memoryUsage: MemoryUsage;
	cpuUsage: CpuUsage;
	v8HeapStats: V8HeapStats;
	eventLoopDelayMs: number;
	uptimeMs: number;
	mongoStats: MongoStats;
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

export interface MongoStats {
	readyState: ConnectionStates;
	host: string;
	port: number;
	dbName: string;
	serverStatus: mongo.Document;
	serverInfo: mongo.Document;
	stats: mongo.Document;
	collectionStats: mongo.Document[];
}
