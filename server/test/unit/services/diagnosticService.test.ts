import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { DiagnosticService } from "../../../src/domain/diagnostics/diagnostic.service.ts";
import type { IDb } from "../../../src/db/db.interface.ts";
import type { Mongoose } from "mongoose";
import type { IntervalHistogram } from "perf_hooks";
import { createMockLogger } from "../../helpers/createMockLogger.ts";

// ── Test helpers ─────────────────────────────────────────────────────────────

const makeDb = (overrides?: {
	collections?: Array<{ collectionName: string }>;
	collStats?: Record<string, unknown>;
	dbStats?: Record<string, unknown>;
	countDocuments?: number;
	countDocumentsFn?: () => Promise<number>;
	serverStatus?: () => Promise<Record<string, unknown>>;
	dbStatsFn?: () => Promise<Record<string, unknown>>;
	failingCollections?: string[];
	noDb?: boolean;
}): IDb<Mongoose> => {
	const collections = overrides?.collections ?? [];
	const collStats = overrides?.collStats ?? {
		storageSize: 100,
		totalIndexSize: 50,
		totalSize: 150,
	};
	const dbStats = overrides?.dbStats ?? { totalSize: 1000 };
	const countDocumentsFn = overrides?.countDocumentsFn ?? jest.fn<() => Promise<number>>().mockResolvedValue(overrides?.countDocuments ?? 42);
	const serverStatus = overrides?.serverStatus ?? (async () => ({}));
	const failingCollections = overrides?.failingCollections ?? [];

	const dbApi = overrides?.noDb
		? null
		: {
				stats: overrides?.dbStatsFn ?? jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue(dbStats),
				collections: jest.fn<() => Promise<Array<{ collectionName: string }>>>().mockResolvedValue(collections),
				command: jest.fn(async (command: Record<string, unknown>) => {
					if ("serverStatus" in command) return serverStatus();
					if (failingCollections.includes(String(command.collStats))) throw new Error("collStats failed");
					return collStats;
				}),
				collection: jest.fn().mockReturnValue({ countDocuments: countDocumentsFn }),
			};

	return {
		getConnection: jest.fn<() => Promise<Mongoose>>().mockResolvedValue({
			connection: {
				db: dbApi,
				readyState: 1,
				host: "localhost",
				port: 27017,
				name: "uptime_db",
			},
		} as unknown as Mongoose),
	} as unknown as IDb<Mongoose>;
};

const makeServerStatus = (samples: Array<Record<string, unknown>>) => {
	const serverStatus = jest.fn<() => Promise<Record<string, unknown>>>();
	samples.forEach((sample) => serverStatus.mockResolvedValueOnce(sample));
	return serverStatus;
};

const makeHistogram = (meanNs: number) => ({
	mean: meanNs,
	enable: jest.fn(),
	disable: jest.fn(),
	reset: jest.fn(),
});

const asHistogram = (histogram: ReturnType<typeof makeHistogram>) => histogram as unknown as IntervalHistogram;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DiagnosticService", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// ── constructor ─────────────────────────────────────────────────────────

	describe("constructor", () => {
		it("enables the event loop delay histogram", () => {
			const histogram = makeHistogram(0);
			const service = new DiagnosticService(makeDb(), createMockLogger(), asHistogram(histogram));

			expect(histogram.enable).toHaveBeenCalledTimes(1);
			expect(service).toBeDefined();
		});
	});

	// ── getSystemStats ──────────────────────────────────────────────────────

	describe("getSystemStats", () => {
		it("returns only the slimmed diagnostic shape (no serverStatus/serverInfo/memoryUsage)", async () => {
			const service = new DiagnosticService(makeDb(), createMockLogger());
			const result = await service.getSystemStats();

			expect(Object.keys(result).sort()).toEqual(["cpuUsage", "eventLoopDelayMs", "mongoStats", "osStats", "uptimeMs", "v8HeapStats"].sort());

			expect(result.osStats).toEqual({ totalMemoryBytes: expect.any(Number) });
			expect(result.cpuUsage).toEqual({ usagePercentage: expect.any(Number) });
			expect(result.v8HeapStats).toEqual({
				totalHeapSizeBytes: expect.any(Number),
				usedHeapSizeBytes: expect.any(Number),
				heapSizeLimitBytes: expect.any(Number),
			});
			expect(typeof result.eventLoopDelayMs).toBe("number");
			expect(result.uptimeMs).toBeGreaterThan(0);
		});

		it("returns slimmed mongoStats with `collections` (not `collectionStats`) and no serverStatus/serverInfo", async () => {
			const db = makeDb({
				collections: [{ collectionName: "monitors" }, { collectionName: "checks" }],
				collStats: { storageSize: 200, totalIndexSize: 80, totalSize: 280 },
				dbStats: { totalSize: 9999 },
				countDocuments: 7,
			});
			const service = new DiagnosticService(db, createMockLogger());
			const result = await service.getSystemStats();

			expect(Object.keys(result.mongoStats ?? {}).sort()).toEqual(
				[
					"collections",
					"dbName",
					"host",
					"port",
					"readyState",
					"totalSize",
					"readsPerSecond",
					"insertsPerSecond",
					"updatesPerSecond",
					"deletesPerSecond",
					"writesPerSecond",
				].sort()
			);
			expect(result.mongoStats?.totalSize).toBe(9999);
			expect(result.mongoStats?.collections).toHaveLength(2);
			expect(result.mongoStats?.collections[0]).toEqual({
				name: "monitors",
				documentCount: 7,
				storageSize: 200,
				totalIndexSize: 80,
				totalSize: 280,
			});
		});

		it("derives mongoStats.totalSize from storageSize + indexSize when the server omits it (e.g. Atlas shared tier)", async () => {
			const db = makeDb({
				collections: [{ collectionName: "monitors" }],
				dbStats: { storageSize: 376832, indexSize: 1155072 },
			});
			const service = new DiagnosticService(db, createMockLogger());
			const result = await service.getSystemStats();

			expect(result.mongoStats?.totalSize).toBe(376832 + 1155072);
			expect(Number.isFinite(result.mongoStats?.totalSize)).toBe(true);
		});

		it("derives collection totalSize and defaults missing size fields to 0 when collStats omits them", async () => {
			const db = makeDb({
				collections: [{ collectionName: "checks" }],
				collStats: { storageSize: 200 },
			});
			const service = new DiagnosticService(db, createMockLogger());
			const result = await service.getSystemStats();

			const coll = result.mongoStats?.collections[0];
			expect(coll).toMatchObject({
				name: "checks",
				storageSize: 200,
				totalIndexSize: 0,
				totalSize: 200, // storageSize (200) + totalIndexSize (0)
			});
			expect(Number.isFinite(coll?.totalSize)).toBe(true);
		});

		it("includes bucketCount on timeseries collections, omits it elsewhere", async () => {
			const db = makeDb({
				collections: [{ collectionName: "checks" }],
				collStats: { storageSize: 1, totalIndexSize: 2, totalSize: 3, timeseries: { bucketCount: 12 } },
			});
			const service = new DiagnosticService(db, createMockLogger());
			const result = await service.getSystemStats();

			expect(result.mongoStats?.collections[0]?.bucketCount).toBe(12);

			const db2 = makeDb({ collections: [{ collectionName: "monitors" }] });
			const service2 = new DiagnosticService(db2, createMockLogger());
			const result2 = await service2.getSystemStats();
			expect(result2.mongoStats?.collections[0]).not.toHaveProperty("bucketCount");
		});

		it("returns null mongoStats and keeps the runtime stats when the connection has no db handle", async () => {
			const logger = createMockLogger();
			const service = new DiagnosticService(makeDb({ noDb: true }), logger);
			const result = await service.getSystemStats();

			expect(result.mongoStats).toBeNull();
			expect(result.v8HeapStats.usedHeapSizeBytes).toEqual(expect.any(Number));
			expect(result.cpuUsage).toEqual({ usagePercentage: expect.any(Number) });
			expect(typeof result.eventLoopDelayMs).toBe("number");
			expect(logger.warn).toHaveBeenCalledTimes(1);
		});

		it("returns null mongoStats when db.stats fails", async () => {
			const logger = createMockLogger();
			const db = makeDb({ dbStatsFn: jest.fn<() => Promise<Record<string, unknown>>>().mockRejectedValue(new Error("stats failed")) });
			const service = new DiagnosticService(db, logger);
			const result = await service.getSystemStats();

			expect(result.mongoStats).toBeNull();
			expect(logger.warn).toHaveBeenCalledTimes(1);
		});

		it("leaves out a collection whose stats fail and keeps the others", async () => {
			const logger = createMockLogger();
			const db = makeDb({
				collections: [{ collectionName: "monitors" }, { collectionName: "broken" }, { collectionName: "checks" }],
				failingCollections: ["broken"],
			});
			const service = new DiagnosticService(db, logger);
			const result = await service.getSystemStats();

			expect(result.mongoStats?.collections.map((collection) => collection.name)).toEqual(["monitors", "checks"]);
			expect(logger.warn).toHaveBeenCalledTimes(1);
			expect(logger.warn).toHaveBeenCalledWith({ err: expect.any(Error) }, "Collection stats are unavailable for broken");
		});

		it("does not warn when every section succeeds", async () => {
			const logger = createMockLogger();
			const service = new DiagnosticService(makeDb({ collections: [{ collectionName: "monitors" }] }), logger);
			await service.getSystemStats();

			expect(logger.warn).not.toHaveBeenCalled();
		});

		it.each([
			{ label: "subtracts the sampling resolution from the mean", meanNs: 25_000_000, expected: 5, resets: 1 },
			{ label: "clamps to 0 when the mean is below the resolution", meanNs: 19_000_000, expected: 0, resets: 1 },
			{ label: "returns 0 when the histogram has no samples", meanNs: Number.NaN, expected: 0, resets: 0 },
		])("eventLoopDelayMs $label", async ({ meanNs, expected, resets }) => {
			const histogram = makeHistogram(meanNs);
			const service = new DiagnosticService(makeDb(), createMockLogger(), asHistogram(histogram));
			const result = await service.getSystemStats();

			expect(result.eventLoopDelayMs).toBeCloseTo(expected);
			expect(histogram.reset).toHaveBeenCalledTimes(resets);
		});

		it("reports the previous event loop delay when the histogram has no new samples", async () => {
			const histogram = makeHistogram(25_000_000);
			const service = new DiagnosticService(makeDb(), createMockLogger(), asHistogram(histogram));
			const first = await service.getSystemStats();
			histogram.mean = Number.NaN;
			const second = await service.getSystemStats();

			expect(first.eventLoopDelayMs).toBeCloseTo(5);
			expect(second.eventLoopDelayMs).toBeCloseTo(5);
			expect(histogram.reset).toHaveBeenCalledTimes(1);
		});

		it("reports the average since mongod started on the first call", async () => {
			const serverStatus = makeServerStatus([
				{ opcounters: { query: 900, getmore: 100, insert: 100, update: 50, delete: 50 }, uptimeMillis: 100_000 },
			]);
			const service = new DiagnosticService(makeDb({ serverStatus }), createMockLogger());
			const result = await service.getSystemStats();

			expect(result.mongoStats).toMatchObject({
				readsPerSecond: 10,
				insertsPerSecond: 1,
				updatesPerSecond: 0.5,
				deletesPerSecond: 0.5,
				writesPerSecond: 2,
			});
		});

		it("reports the rate since the previous call afterwards", async () => {
			const serverStatus = makeServerStatus([
				{ opcounters: { query: 1000, insert: 100, update: 100, delete: 100 }, uptimeMillis: 100_000 },
				{ opcounters: { query: 1050, insert: 110, update: 105, delete: 100 }, uptimeMillis: 105_000 },
			]);
			const service = new DiagnosticService(makeDb({ serverStatus }), createMockLogger());
			await service.getSystemStats();
			jest.advanceTimersByTime(5000);
			const result = await service.getSystemStats();

			expect(result.mongoStats).toMatchObject({
				readsPerSecond: 10,
				insertsPerSecond: 2,
				updatesPerSecond: 1,
				deletesPerSecond: 0,
				writesPerSecond: 3,
			});
		});

		it("reuses the previous rates when polled again inside the minimum window", async () => {
			const serverStatus = makeServerStatus([
				{ opcounters: { query: 1000, insert: 100, update: 100, delete: 100 }, uptimeMillis: 100_000 },
				{ opcounters: { query: 1001, insert: 100, update: 100, delete: 100 }, uptimeMillis: 100_100 },
				{ opcounters: { query: 1200, insert: 100, update: 100, delete: 100 }, uptimeMillis: 110_000 },
			]);
			const service = new DiagnosticService(makeDb({ serverStatus }), createMockLogger());
			const first = await service.getSystemStats();
			jest.advanceTimersByTime(100);
			const second = await service.getSystemStats();
			jest.advanceTimersByTime(9900);
			const third = await service.getSystemStats();

			expect(first.mongoStats?.readsPerSecond).toBe(10);
			expect(second.mongoStats?.readsPerSecond).toBe(10);
			expect(third.mongoStats?.readsPerSecond).toBe(20);
			expect(serverStatus).toHaveBeenCalledTimes(3);
		});

		it("clamps rates to 0 when the counters go backwards after a mongod restart", async () => {
			const serverStatus = makeServerStatus([
				{ opcounters: { query: 1000, insert: 100, update: 100, delete: 100 }, uptimeMillis: 100_000 },
				{ opcounters: { query: 10, insert: 1, update: 1, delete: 1 }, uptimeMillis: 2000 },
			]);
			const service = new DiagnosticService(makeDb({ serverStatus }), createMockLogger());
			await service.getSystemStats();
			jest.advanceTimersByTime(5000);
			const result = await service.getSystemStats();

			expect(result.mongoStats).toMatchObject({
				readsPerSecond: 0,
				insertsPerSecond: 0,
				updatesPerSecond: 0,
				deletesPerSecond: 0,
				writesPerSecond: 0,
			});
		});

		it("reports 0 on the first call when serverStatus has no uptime", async () => {
			const serverStatus = makeServerStatus([{ opcounters: { query: 1000, insert: 100, update: 100, delete: 100 } }]);
			const service = new DiagnosticService(makeDb({ serverStatus }), createMockLogger());
			const result = await service.getSystemStats();

			expect(result.mongoStats?.readsPerSecond).toBe(0);
			expect(result.mongoStats?.writesPerSecond).toBe(0);
		});

		it("reports null rates and warns on each poll when serverStatus fails", async () => {
			const logger = createMockLogger();
			const serverStatus = jest.fn<() => Promise<Record<string, unknown>>>().mockRejectedValue(new Error("not authorized"));
			const service = new DiagnosticService(makeDb({ serverStatus }), logger);
			const result = await service.getSystemStats();
			await service.getSystemStats();

			expect(result.mongoStats).toMatchObject({
				readsPerSecond: null,
				insertsPerSecond: null,
				updatesPerSecond: null,
				deletesPerSecond: null,
				writesPerSecond: null,
				totalSize: 1000,
			});
			expect(logger.warn).toHaveBeenCalledTimes(2);
		});

		it("uses collStats.count and does not scan when it is present", async () => {
			const countDocumentsFn = jest.fn<() => Promise<number>>().mockResolvedValue(999);
			const db = makeDb({
				collections: [{ collectionName: "monitors" }],
				collStats: { count: 24, storageSize: 1, totalIndexSize: 1, totalSize: 2 },
				countDocumentsFn,
			});
			const result = await new DiagnosticService(db, createMockLogger()).getSystemStats();

			expect(result.mongoStats?.collections[0]?.documentCount).toBe(24);
			expect(countDocumentsFn).not.toHaveBeenCalled();
		});

		it("falls back to countDocuments when collStats has no count", async () => {
			const countDocumentsFn = jest.fn<() => Promise<number>>().mockResolvedValue(109_764);
			const db = makeDb({
				collections: [{ collectionName: "checks" }],
				collStats: { storageSize: 1, totalIndexSize: 1, totalSize: 2, timeseries: { bucketCount: 930 } },
				countDocumentsFn,
			});
			const result = await new DiagnosticService(db, createMockLogger()).getSystemStats();

			expect(result.mongoStats?.collections[0]).toMatchObject({ documentCount: 109_764, bucketCount: 930 });
			expect(countDocumentsFn).toHaveBeenCalledTimes(1);
		});

		it("queries MongoDB on every request", async () => {
			const db = makeDb();
			const service = new DiagnosticService(db, createMockLogger());
			await service.getSystemStats();
			await service.getSystemStats();

			expect(db.getConnection).toHaveBeenCalledTimes(2);
		});
	});
});
