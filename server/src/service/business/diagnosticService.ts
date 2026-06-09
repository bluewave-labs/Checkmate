import v8 from "v8";
import os from "os";
import { IDb } from "@/db/IDb.js";
import { Mongoose } from "mongoose";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "diagnosticService";

export interface CollectionDiagnostics {
	name: string;
	documentCount: number;
	storageSize: number;
	totalIndexSize: number;
	totalSize: number;
	bucketCount?: number;
}

export interface MongoDiagnostics {
	readyState: number;
	host: string;
	port: number;
	dbName: string;
	totalSize: number;
	collections: CollectionDiagnostics[];
}

export interface Diagnostics {
	osStats: { totalMemoryBytes: number };
	cpuUsage: { usagePercentage: number };
	v8HeapStats: {
		totalHeapSizeBytes: number;
		usedHeapSizeBytes: number;
		heapSizeLimitBytes: number;
	};
	eventLoopDelayMs: number;
	uptimeMs: number;
	mongoStats: MongoDiagnostics;
}

export interface IDiagnosticService {
	getSystemStats(): Promise<Diagnostics>;
}

export class DiagnosticService implements IDiagnosticService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(private db: IDb<Mongoose>) {
		/**
		 * Performance Observer for monitoring system performance metrics.
		 * Clears performance marks after each measurement to prevent memory leaks.
		 */
		const obs = new PerformanceObserver((items) => {
			items.getEntries();
			performance.clearMarks();
		});
		obs.observe({ entryTypes: ["measure"] });
	}

	get serviceName() {
		return DiagnosticService.SERVICE_NAME;
	}

	private getCPUUsagePercentage = async (): Promise<number> => {
		const startUsage = process.cpuUsage();
		const timingPeriod = 1000; // measured in ms
		await new Promise((resolve) => setTimeout(resolve, timingPeriod));
		const endUsage = process.cpuUsage(startUsage);
		return ((endUsage.user + endUsage.system) / 1000 / timingPeriod) * 100;
	};

	private getMongoDBStats = async (): Promise<MongoDiagnostics> => {
		const mongo = await this.db.getConnection();
		const db = mongo.connection.db;
		if (!db) {
			throw new AppError({ message: "Database connection is not available", service: SERVICE_NAME, method: "getMongoDBStats" });
		}

		const dbStats = await db.stats();
		const rawCollections = await db.collections();

		const collections: CollectionDiagnostics[] = await Promise.all(
			rawCollections
				.filter((collection) => !collection.collectionName.startsWith("system"))
				.map(async (collection) => {
					const stats = await db.command({ collStats: collection.collectionName });
					const documentCount = await db.collection(collection.collectionName).countDocuments({});
					const entry: CollectionDiagnostics = {
						name: collection.collectionName,
						documentCount,
						storageSize: stats.storageSize ?? 0,
						totalIndexSize: stats.totalIndexSize ?? 0,
						totalSize: stats.totalSize ?? (stats.storageSize ?? 0) + (stats.totalIndexSize ?? 0),
					};
					if (stats.timeseries?.bucketCount !== undefined) {
						entry.bucketCount = stats.timeseries.bucketCount;
					}
					return entry;
				})
		);

		return {
			readyState: mongo.connection.readyState,
			host: mongo.connection.host,
			port: mongo.connection.port,
			dbName: mongo.connection.name,
			totalSize: dbStats.totalSize ?? (dbStats.storageSize ?? 0) + (dbStats.indexSize ?? 0),
			collections,
		};
	};

	getSystemStats = async (): Promise<Diagnostics> => {
		const osStats = { totalMemoryBytes: os.totalmem() };

		const cpuUsage = { usagePercentage: await this.getCPUUsagePercentage() };

		const heapStats = v8.getHeapStatistics();
		const v8HeapStats = {
			totalHeapSizeBytes: heapStats.total_heap_size,
			usedHeapSizeBytes: heapStats.used_heap_size,
			heapSizeLimitBytes: heapStats.heap_size_limit,
		};

		let eventLoopDelayMs = 0;
		performance.mark("start");
		await new Promise((resolve) => setTimeout(resolve, 0));
		performance.mark("end");
		performance.measure("eventLoopDelay", "start", "end");
		const entries = performance.getEntriesByName("eventLoopDelay");
		if (entries.length > 0 && entries[0] !== undefined) {
			eventLoopDelayMs = entries[0].duration;
		}

		const uptimeMs = process.uptime() * 1000;
		const mongoStats = await this.getMongoDBStats();

		return {
			osStats,
			cpuUsage,
			v8HeapStats,
			eventLoopDelayMs,
			uptimeMs,
			mongoStats,
		};
	};
}
