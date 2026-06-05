import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { DiagnosticService } from "../../../src/service/business/diagnosticService.ts";
import type { IDb } from "../../../src/db/IDb.ts";
import type { Mongoose } from "mongoose";

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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("DiagnosticService", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("serviceName", () => {
		it("returns diagnosticService from static property", () => {
			expect(DiagnosticService.SERVICE_NAME).toBe("diagnosticService");
		});

		it("returns diagnosticService from instance getter", () => {
			const service = new DiagnosticService(makeDb());
			expect(service.serviceName).toBe("diagnosticService");
		});
	});

	// ── constructor ─────────────────────────────────────────────────────────

	describe("constructor", () => {
		it("sets up PerformanceObserver that clears marks on callback", () => {
			let capturedCallback: ((list: PerformanceObserverEntryList) => void) | null = null;
			const originalObserver = globalThis.PerformanceObserver;
			const mockObserve = jest.fn();

			globalThis.PerformanceObserver = jest.fn().mockImplementation((cb: any) => {
				capturedCallback = cb;
				return { observe: mockObserve };
			}) as any;

			const clearMarksSpy = jest.spyOn(performance, "clearMarks");
			const service = new DiagnosticService(makeDb());

			expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ["measure"] });
			expect(capturedCallback).not.toBeNull();

			const mockEntryList = { getEntries: jest.fn().mockReturnValue([]) } as unknown as PerformanceObserverEntryList;
			capturedCallback!(mockEntryList);

			expect(mockEntryList.getEntries).toHaveBeenCalled();
			expect(clearMarksSpy).toHaveBeenCalled();

			clearMarksSpy.mockRestore();
			globalThis.PerformanceObserver = originalObserver;
			expect(service).toBeDefined();
		});
	});

	// ── getSystemStats ──────────────────────────────────────────────────────

	describe("getSystemStats", () => {
		it("returns only the slimmed diagnostic shape (no serverStatus/serverInfo/memoryUsage)", async () => {
			const service = new DiagnosticService(makeDb());
			const promise = service.getSystemStats();
			// getCPUUsagePercentage waits 1s, then event loop delay waits 0ms
			jest.advanceTimersByTime(1000);
			await jest.advanceTimersByTimeAsync(10);
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
			jest.advanceTimersByTime(1000);
			await jest.advanceTimersByTimeAsync(10);
			const result = await promise;

			expect(Object.keys(result.mongoStats).sort()).toEqual(["collections", "dbName", "host", "port", "readyState", "totalSize"].sort());
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

		it("includes bucketCount on timeseries collections, omits it elsewhere", async () => {
			const db = makeDb({
				collections: [{ collectionName: "checks" }],
				collStats: { storageSize: 1, totalIndexSize: 2, totalSize: 3, timeseries: { bucketCount: 12 } },
			});
			const service = new DiagnosticService(db);
			const promise = service.getSystemStats();
			jest.advanceTimersByTime(1000);
			await jest.advanceTimersByTimeAsync(10);
			const result = await promise;

			expect(result.mongoStats.collections[0]?.bucketCount).toBe(12);

			const db2 = makeDb({ collections: [{ collectionName: "monitors" }] });
			const service2 = new DiagnosticService(db2);
			const promise2 = service2.getSystemStats();
			jest.advanceTimersByTime(1000);
			await jest.advanceTimersByTimeAsync(10);
			const result2 = await promise2;
			expect(result2.mongoStats.collections[0]).not.toHaveProperty("bucketCount");
		});

		it("throws AppError when the mongo connection has no db handle", async () => {
			jest.useRealTimers();
			const service = new DiagnosticService(makeDb({ noDb: true }));
			await expect(service.getSystemStats()).rejects.toThrow("Database connection is not available");
			jest.useFakeTimers();
		});

		it("reads eventLoopDelay from real performance entries", async () => {
			jest.useRealTimers();
			const service = new DiagnosticService(makeDb());
			const result = await service.getSystemStats();
			expect(typeof result.eventLoopDelayMs).toBe("number");
			expect(result.eventLoopDelayMs).toBeGreaterThanOrEqual(0);
			jest.useFakeTimers();
		});

		it.each([
			{ label: "empty entries array", entries: [] },
			{ label: "undefined entry in array", entries: [undefined] },
		])("defaults eventLoopDelayMs to 0 when $label", async ({ entries }) => {
			const service = new DiagnosticService(makeDb());
			const originalGetEntries = performance.getEntriesByName;
			const originalMeasure = performance.measure;
			const originalMark = performance.mark;

			performance.mark = jest.fn() as any;
			performance.measure = jest.fn() as any;
			performance.getEntriesByName = jest.fn().mockReturnValue(entries) as any;

			const promise = service.getSystemStats();
			jest.advanceTimersByTime(1000);
			await jest.advanceTimersByTimeAsync(10);
			const result = await promise;

			expect(result.eventLoopDelayMs).toBe(0);
			expect(performance.getEntriesByName).toHaveBeenCalledWith("eventLoopDelay");

			performance.getEntriesByName = originalGetEntries;
			performance.measure = originalMeasure;
			performance.mark = originalMark;
		});
	});
});
