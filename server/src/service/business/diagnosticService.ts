import v8 from "v8";
import os from "os";
import { IDb } from "@/db/IDb.js";
import { Mongoose } from "mongoose";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "diagnosticService";

export interface IDiagnosticService {
	getCPUUsage(): Promise<{ userUsageMs: number; systemUsageMs: number; usagePercentage: number }>;
	getSystemStats(): Promise<{
		osStats: { freeMemoryBytes: number; totalMemoryBytes: number };
		memoryUsage: Record<keyof NodeJS.MemoryUsage, number>;
		cpuUsage: { userUsageMs: number; systemUsageMs: number; usagePercentage: number };
		v8HeapStats: { totalHeapSizeBytes: number; usedHeapSizeBytes: number; heapSizeLimitBytes: number };
		eventLoopDelayMs: number;
		uptimeMs: number;
	}>;
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

	getCPUUsage = async () => {
		const startUsage = process.cpuUsage();
		const timingPeriod = 1000; // measured in ms
		await new Promise((resolve) => setTimeout(resolve, timingPeriod));
		const endUsage = process.cpuUsage(startUsage);
		const cpuUsage = {
			userUsageMs: endUsage.user / 1000,
			systemUsageMs: endUsage.system / 1000,
			usagePercentage: ((endUsage.user + endUsage.system) / 1000 / timingPeriod) * 100,
		};
		return cpuUsage;
	};

	private getMongoDBStats = async () => {
		const mongo = await this.db.getConnection();
		const db = mongo.connection.db;
		if (!db) {
			throw new AppError({ message: "Database connection is not available", service: SERVICE_NAME, method: "getMongoDBStats" });
		}

		const readyState = mongo.connection.readyState;
		const host = mongo.connection.host;
		const port = mongo.connection.port;
		const dbName = mongo.connection.name;

		const serverStatus = await db.admin().serverStatus();
		const serverInfo = await db.admin().serverInfo();

		const stats = await db.stats();
		const collections = await db.collections();

		const collectionStats = await Promise.all(
			(collections || []).map(async (collection) => {
				const stats = await db.command({ collStats: collection.collectionName });
				const documentCount = await db.collection(collection.collectionName).countDocuments({});
				return { name: collection.collectionName, documentCount, ...stats };
			})
		);

		return {
			readyState,
			host,
			port,
			dbName,
			serverStatus,
			serverInfo,
			stats,
			collectionStats,
		};
	};

	getSystemStats = async () => {
		// Memory Usage
		const totalMemory = os.totalmem();
		const freeMemory = os.freemem();

		const osStats = {
			freeMemoryBytes: freeMemory, // bytes
			totalMemoryBytes: totalMemory, // bytes
		};

		const used = process.memoryUsage();

		// In MB
		const memoryUsage: Record<keyof NodeJS.MemoryUsage, number> = {
			rss: Math.round((used.rss / 1024 / 1024) * 100) / 100,
			heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
			heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
			external: Math.round((used.external / 1024 / 1024) * 100) / 100,
			arrayBuffers: Math.round((used.arrayBuffers / 1024 / 1024) * 100) / 100,
		};

		// CPU Usage
		const cpuMetrics = await this.getCPUUsage();

		// V8 Heap Statistics
		const heapStats = v8.getHeapStatistics();
		const v8Metrics = {
			totalHeapSizeBytes: heapStats.total_heap_size, // bytes
			usedHeapSizeBytes: heapStats.used_heap_size, // bytes
			heapSizeLimitBytes: heapStats.heap_size_limit, // bytes
		};

		// Event Loop Delay
		let eventLoopDelay = 0;
		performance.mark("start");
		await new Promise((resolve) => setTimeout(resolve, 0));
		performance.mark("end");
		performance.measure("eventLoopDelay", "start", "end");
		const entries = performance.getEntriesByName("eventLoopDelay");
		if (entries.length > 0 && entries[0] !== undefined) {
			eventLoopDelay = entries[0].duration;
		}

		// Uptime
		const uptimeMs = process.uptime() * 1000; // ms

		// Mongo
		const mongoStats = await this.getMongoDBStats();

		// Combine Metrics
		const diagnostics = {
			osStats,
			memoryUsage,
			cpuUsage: cpuMetrics,
			v8HeapStats: v8Metrics,
			eventLoopDelayMs: eventLoopDelay,
			uptimeMs,
			mongoStats,
		};

		return diagnostics;
	};
}
