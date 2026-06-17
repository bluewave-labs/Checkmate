import v8 from "v8";
import os from "os";
import { IDb } from "@/db/db.interface.js";
import { Mongoose } from "mongoose";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "diagnosticService";

export interface MongoStats {
	reads: number;
	inserts: number;
	updates: number;
	deletes: number;
	timestamp: number;
}

export interface MongoOpsPerSecond {
	readsPerSecond: number;
	insertsPerSecond: number;
	updatesPerSecond: number;
	deletesPerSecond: number;
	writesPerSecond: number;
}

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
	readsPerSecond: number;
	insertsPerSecond: number;
	updatesPerSecond: number;
	deletesPerSecond: number;
	writesPerSecond: number;
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

	private lastMongoOpsPerSecond: MongoStats | null = null;

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

	private getMongoOpsPerSecond = async (): Promise<MongoOpsPerSecond | null> => {
		try {
			const mongo = await this.db.getConnection();
			const db = mongo.connection.db;
			if (!db) {
				throw new AppError({ message: "Database connection is not available", service: SERVICE_NAME, method: "getMongoDBStats" });
			}
			const sample = async (): Promise<MongoStats> => {
				const res = await db.command({ serverStatus: 1 });
				return {
					reads: (res.opcounters?.query ?? 0) + (res.opcounters?.getmore ?? 0),
					inserts: res.opcounters?.insert ?? 0,
					updates: res.opcounters?.update ?? 0,
					deletes: res.opcounters?.delete ?? 0,
					timestamp: Date.now(),
				};
			};

			// First call has no baseline, seed one so we always have a rate
			if (this.lastMongoOpsPerSecond === null) {
				this.lastMongoOpsPerSecond = await sample();
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}

			const previous = this.lastMongoOpsPerSecond;
			const current = await sample();
			this.lastMongoOpsPerSecond = current;

			const elapsedSeconds = (current.timestamp - previous.timestamp) / 1000;
			return {
				readsPerSecond: (current.reads - previous.reads) / elapsedSeconds,
				insertsPerSecond: (current.inserts - previous.inserts) / elapsedSeconds,
				updatesPerSecond: (current.updates - previous.updates) / elapsedSeconds,
				deletesPerSecond: (current.deletes - previous.deletes) / elapsedSeconds,
				writesPerSecond:
					(current.inserts - previous.inserts + current.updates - previous.updates + current.deletes - previous.deletes) / elapsedSeconds,
			};
		} catch {
			return null;
		}
	};

	private getMongoDBStats = async (): Promise<MongoDiagnostics> => {
		const mongo = await this.db.getConnection();
		const db = mongo.connection.db;
		if (!db) {
			throw new AppError({ message: "Database connection is not available", service: SERVICE_NAME, method: "getMongoDBStats" });
		}

		const opsPerSecond = await this.getMongoOpsPerSecond();

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
			readsPerSecond: opsPerSecond?.readsPerSecond ?? 0,
			insertsPerSecond: opsPerSecond?.insertsPerSecond ?? 0,
			updatesPerSecond: opsPerSecond?.updatesPerSecond ?? 0,
			deletesPerSecond: opsPerSecond?.deletesPerSecond ?? 0,
			writesPerSecond: opsPerSecond?.writesPerSecond ?? 0,
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
