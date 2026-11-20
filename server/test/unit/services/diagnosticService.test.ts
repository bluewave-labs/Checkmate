import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { DiagnosticService } from "../../../src/domain/diagnostics/diagnostic.service.ts";
import type { IDb } from "../../../src/db/db.interface.ts";
import type { Mongoose } from "mongoose";
import type { IntervalHistogram } from "perf_hooks";

// ── Test helpers ─────────────────────────────────────────────────────────────

const makeDb = (overrides?: {
	collections?: Array<{ collectionName: string }>;
	collStats?: Record<string, unknown>;
	dbStats?: Record<string, unknown>;
	countDocuments?: number;
	noDb?: boolean;
}): IDb<Mongoose> => {
	const collections = overrides?.collections ?? [];
	const collStats = overrides?.collStats ?? {
		storageSize: 100,
		totalIndexSize: 50,
		totalSize: 150,
	};
	const dbStats = overrides?.dbStats ?? { totalSize: 1000 };
	const countDocuments = overrides?.countDocuments ?? 42;

	const dbApi = overrides?.noDb
		? null
		: {
				stats: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue(dbStats),
				collections: jest.fn<() => Promise<Array<{ collectionName: string }>>>().mockResolvedValue(collections),
				command: jest.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue(collStats),
				collection: jest.fn().mockReturnValue({
					countDocuments: jest.fn<() => Promise<number>>().mockResolvedValue(countDocuments),
				}),
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
			const service = new DiagnosticService(makeDb(), asHistogram(histogram));

			expect(histogram.enable).toHaveBeenCalledTimes(1);
			expect(service).toBeDefined();
		});
	});

	// ── getSystemStats ──────────────────────────────────────────────────────

	describe("getSystemStats", () => {
		it("returns only the slimmed diagnostic shape (no serverStatus/serverInfo/memoryUsage)", async () => {
			const service = new DiagnosticService(makeDb());
			const promise = service.getSystemStats();
			// getCPUUsagePercentage waits 1s, the first mongo ops sample waits another 1s, then event loop delay waits 0ms
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

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
			const service = new DiagnosticService(db);
			const promise = service.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

			expect(Object.keys(result.mongoStats).sort()).toEqual(
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
			expect(result.mongoStats.totalSize).toBe(9999);
			expect(result.mongoStats.collections).toHaveLength(2);
			expect(result.mongoStats.collections[0]).toEqual({
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
			const service = new DiagnosticService(db);
			const promise = service.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

			expect(result.mongoStats.totalSize).toBe(376832 + 1155072);
			expect(Number.isFinite(result.mongoStats.totalSize)).toBe(true);
		});

		it("derives collection totalSize and defaults missing size fields to 0 when collStats omits them", async () => {
			const db = makeDb({
				collections: [{ collectionName: "checks" }],
				collStats: { storageSize: 200 },
			});
			const service = new DiagnosticService(db);
			const promise = service.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

			const coll = result.mongoStats.collections[0];
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
			const service = new DiagnosticService(db);
			const promise = service.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

			expect(result.mongoStats.collections[0]?.bucketCount).toBe(12);

			const db2 = makeDb({ collections: [{ collectionName: "monitors" }] });
			const service2 = new DiagnosticService(db2);
			const promise2 = service2.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result2 = await promise2;
			expect(result2.mongoStats.collections[0]).not.toHaveProperty("bucketCount");
		});

		it("throws AppError when the mongo connection has no db handle", async () => {
			jest.useRealTimers();
			const service = new DiagnosticService(makeDb({ noDb: true }));
			await expect(service.getSystemStats()).rejects.toThrow("Database connection is not available");
			jest.useFakeTimers();
		});

		it.each([
			{ label: "subtracts the sampling resolution from the mean", meanNs: 25_000_000, expected: 5 },
			{ label: "clamps to 0 when the mean is below the resolution", meanNs: 19_000_000, expected: 0 },
			{ label: "returns 0 when the histogram has no samples", meanNs: Number.NaN, expected: 0 },
		])("eventLoopDelayMs $label", async ({ meanNs, expected }) => {
			const histogram = makeHistogram(meanNs);
			const service = new DiagnosticService(makeDb(), asHistogram(histogram));
			const promise = service.getSystemStats();
			await jest.advanceTimersByTimeAsync(2500);
			const result = await promise;

			expect(result.eventLoopDelayMs).toBeCloseTo(expected);
			expect(histogram.reset).toHaveBeenCalledTimes(1);
		});
	});
});
