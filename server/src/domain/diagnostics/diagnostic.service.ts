import v8 from "v8";
import os from "os";
import { monitorEventLoopDelay, type IntervalHistogram } from "perf_hooks";
import type { IDiagnosticsRepository } from "@/domain/diagnostics/diagnostic.repository.interface.js";
import type { CollectionDiagnostics, Diagnostics, MongoDiagnostics } from "@/domain/diagnostics/diagnostic.type.js";
import { ILogger } from "@/utils/logger/logger.js";

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
	private logger: ILogger;

	private lastMongoOpsPerSecond: MongoStats | null = null;
	private lastOpsRates: MongoOpsPerSecond = ZERO_OPS;
	private lastCpuSample = { usage: process.cpuUsage(), timestamp: performance.now() };
	private lastCpuFraction = 0;
	private lastEventLoopDelayMs = 0;

	constructor(
		private diagnosticsRepository: IDiagnosticsRepository,
		logger: ILogger,
		private eventLoopHistogram: IntervalHistogram = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS })
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
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

	private getMongoOpsPerSecond = async (): Promise<MongoOpsPerSecond | null> => {
		try {
			const counters = await this.diagnosticsRepository.getOpCounters();
			const current: MongoStats = {
				reads: counters.reads,
				inserts: counters.inserts,
				updates: counters.updates,
				deletes: counters.deletes,
				timestamp: Date.now(),
			};
			const isFirstSample = this.lastMongoOpsPerSecond === null;
			const previous = this.lastMongoOpsPerSecond ?? {
				reads: 0,
				inserts: 0,
				updates: 0,
				deletes: 0,
				timestamp: current.timestamp - counters.uptimeMs,
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
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "MongoDB operation counters are unavailable");
			return null;
		}
	};

	private getCollections = async (names: string[]): Promise<CollectionDiagnostics[]> => {
		const settled = await Promise.allSettled(names.map((name) => this.diagnosticsRepository.getCollectionStats(name)));
		const collections: CollectionDiagnostics[] = [];
		settled.forEach((result, index) => {
			if (result.status === "rejected") {
				this.logger.warn({ err: result.reason }, `Collection stats are unavailable for ${names[index]}`);
				return;
			}
			collections.push(result.value);
		});
		return collections;
	};

	private getMongoDBStats = async (): Promise<MongoDiagnostics | null> => {
		try {
			const connection = await this.diagnosticsRepository.getConnectionInfo();
			const [opsPerSecond, totalSize, names] = await Promise.all([
				this.getMongoOpsPerSecond(),
				this.diagnosticsRepository.getDatabaseSize(),
				this.diagnosticsRepository.listCollectionNames(),
			]);
			const collections = await this.getCollections(names);

			return {
				readyState: connection.readyState,
				readsPerSecond: opsPerSecond?.readsPerSecond ?? null,
				insertsPerSecond: opsPerSecond?.insertsPerSecond ?? null,
				updatesPerSecond: opsPerSecond?.updatesPerSecond ?? null,
				deletesPerSecond: opsPerSecond?.deletesPerSecond ?? null,
				writesPerSecond: opsPerSecond?.writesPerSecond ?? null,
				host: connection.host,
				port: connection.port,
				dbName: connection.dbName,
				totalSize,
				collections,
			};
		} catch (error: unknown) {
			this.logger.warn({ err: error }, "MongoDB diagnostics are unavailable");
			return null;
		}
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
