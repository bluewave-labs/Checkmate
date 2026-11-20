import v8 from "v8";
import os from "os";
import { monitorEventLoopDelay, type IntervalHistogram } from "perf_hooks";
import { IDb } from "@/db/db.interface.js";
import type { Mongoose, mongo } from "mongoose";
import { AppError, internalError } from "@/utils/AppError.js";
import type { CollectionDiagnostics, Diagnostics, MongoDiagnostics } from "@/domain/diagnostics/diagnostic.type.js";

const SERVICE_NAME = "diagnosticService";
const MIN_CPU_WINDOW_MS = 500;
const MIN_OPS_WINDOW_MS = 500;
const EVENT_LOOP_RESOLUTION_MS = 20;
const NS_PER_MS = 1_000_000;

const ZERO_OPS: MongoOpsPerSecond = {
	readsPerSecond: 0,
	insertsPerSecond: 0,
	updatesPerSecond: 0,
	deletesPerSecond: 0,
	writesPerSecond: 0,
};
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

export interface IDiagnosticService {
	getSystemStats(): Promise<Diagnostics>;
}

export class DiagnosticService implements IDiagnosticService {
	static SERVICE_NAME = SERVICE_NAME;

	private lastMongoOpsPerSecond: MongoStats | null = null;
	private lastOpsRates: MongoOpsPerSecond = ZERO_OPS;
	private lastCpuSample = { usage: process.cpuUsage(), timestamp: performance.now() };
	private lastCpuFraction = 0;
	private lastEventLoopDelayMs = 0;

	constructor(
		private db: IDb<Mongoose>,
		private eventLoopHistogram: IntervalHistogram = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS })
	) {
		this.eventLoopHistogram.enable();
	}

	private getCPUUsagePercentage = (): number => {
		const now = performance.now();
		const elapsedMs = now - this.lastCpuSample.timestamp;
		if (elapsedMs < MIN_CPU_WINDOW_MS) return this.lastCpuFraction;
		const delta = process.cpuUsage(this.lastCpuSample.usage);
		this.lastCpuSample = { usage: process.cpuUsage(), timestamp: now };
		this.lastCpuFraction = (delta.user + delta.system) / 1000 / elapsedMs;
		return this.lastCpuFraction;
	};

	private getEventLoopDelayMs = (): number => {
		const meanNs = this.eventLoopHistogram.mean;
		if (Number.isNaN(meanNs)) return this.lastEventLoopDelayMs;
		this.eventLoopHistogram.reset();
		this.lastEventLoopDelayMs = Math.max(0, meanNs / NS_PER_MS - EVENT_LOOP_RESOLUTION_MS);
		return this.lastEventLoopDelayMs;
	};

	private getMongoOpsPerSecond = async (db: mongo.Db): Promise<MongoOpsPerSecond | null> => {
		try {
			const res = await db.command({ serverStatus: 1 });
			const current: MongoStats = {
				reads: (res.opcounters?.query ?? 0) + (res.opcounters?.getmore ?? 0),
				inserts: res.opcounters?.insert ?? 0,
				updates: res.opcounters?.update ?? 0,
				deletes: res.opcounters?.delete ?? 0,
				timestamp: Date.now(),
			};
			const isFirstSample = this.lastMongoOpsPerSecond === null;
			const previous = this.lastMongoOpsPerSecond ?? {
				reads: 0,
				inserts: 0,
				updates: 0,
				deletes: 0,
				timestamp: current.timestamp - Number(res.uptimeMillis ?? 0),
			};

			const elapsedMs = current.timestamp - previous.timestamp;
			if (!isFirstSample && elapsedMs < MIN_OPS_WINDOW_MS) return this.lastOpsRates;
			this.lastMongoOpsPerSecond = current;
			if (elapsedMs <= 0) return this.lastOpsRates;

			const elapsedSeconds = elapsedMs / 1000;
			const rate = (now: number, before: number) => Math.max(0, now - before) / elapsedSeconds;
			const insertsPerSecond = rate(current.inserts, previous.inserts);
			const updatesPerSecond = rate(current.updates, previous.updates);
			const deletesPerSecond = rate(current.deletes, previous.deletes);
			this.lastOpsRates = {
				readsPerSecond: rate(current.reads, previous.reads),
				insertsPerSecond,
				updatesPerSecond,
				deletesPerSecond,
				writesPerSecond: insertsPerSecond + updatesPerSecond + deletesPerSecond,
			};
			return this.lastOpsRates;
		} catch {
			return null;
		}
	};

	private getCollectionStats = async (db: mongo.Db, name: string): Promise<CollectionDiagnostics> => {
		const stats = await db.command({ collStats: name });
		const documentCount = typeof stats.count === "number" ? stats.count : await db.collection(name).countDocuments({});
		const entry: CollectionDiagnostics = {
			name,
			documentCount,
			storageSize: stats.storageSize ?? 0,
			totalIndexSize: stats.totalIndexSize ?? 0,
			totalSize: stats.totalSize ?? (stats.storageSize ?? 0) + (stats.totalIndexSize ?? 0),
		};
		if (stats.timeseries?.bucketCount !== undefined) {
			entry.bucketCount = stats.timeseries.bucketCount;
		}
		return entry;
	};

	private getMongoDBStats = async (): Promise<MongoDiagnostics> => {
		const mongo = await this.db.getConnection();
		const db = mongo.connection.db;
		if (!db) {
			throw new AppError(internalError, { message: "Database connection is not available", service: SERVICE_NAME });
		}

		const [opsPerSecond, dbStats, rawCollections] = await Promise.all([this.getMongoOpsPerSecond(db), db.stats(), db.collections()]);

		const collections = await Promise.all(
			rawCollections
				.map((collection) => collection.collectionName)
				.filter((name) => !name.startsWith("system"))
				.map((name) => this.getCollectionStats(db, name))
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

		const cpuUsage = { usagePercentage: this.getCPUUsagePercentage() };

		const heapStats = v8.getHeapStatistics();
		const v8HeapStats = {
			totalHeapSizeBytes: heapStats.total_heap_size,
			usedHeapSizeBytes: heapStats.used_heap_size,
			heapSizeLimitBytes: heapStats.heap_size_limit,
		};

		const eventLoopDelayMs = this.getEventLoopDelayMs();
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
