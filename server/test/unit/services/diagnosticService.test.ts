import { describe, expect, it, jest, beforeEach, afterEach } from "@jest/globals";
import { DiagnosticService } from "../../../src/service/business/diagnosticService.ts";

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
			const service = new DiagnosticService();
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
			const service = new DiagnosticService();

			expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ["measure"] });
			expect(capturedCallback).not.toBeNull();

			// Invoke the callback manually
			const mockEntryList = { getEntries: jest.fn().mockReturnValue([]) } as unknown as PerformanceObserverEntryList;
			capturedCallback!(mockEntryList);

			expect(mockEntryList.getEntries).toHaveBeenCalled();
			expect(clearMarksSpy).toHaveBeenCalled();

			clearMarksSpy.mockRestore();
			globalThis.PerformanceObserver = originalObserver;
			expect(service).toBeDefined();
		});
	});

	// ── getCPUUsage ─────────────────────────────────────────────────────────

	describe("getCPUUsage", () => {
		it("returns cpu usage metrics after timing period", async () => {
			const service = new DiagnosticService();
			const promise = service.getCPUUsage();
			jest.advanceTimersByTime(1000);
			const result = await promise;

			expect(result).toHaveProperty("userUsageMs");
			expect(result).toHaveProperty("systemUsageMs");
			expect(result).toHaveProperty("usagePercentage");
			expect(typeof result.userUsageMs).toBe("number");
			expect(typeof result.systemUsageMs).toBe("number");
			expect(typeof result.usagePercentage).toBe("number");
		});
	});

	// ── getSystemStats ──────────────────────────────────────────────────────

	describe("getSystemStats", () => {
		it("returns all diagnostic sections", async () => {
			const service = new DiagnosticService();
			const promise = service.getSystemStats();
			// getCPUUsage has 1s timeout, then event loop delay has 0ms timeout
			jest.advanceTimersByTime(1000);
			// Need to flush the microtask queue and advance again for the nested setTimeout(0)
			await jest.advanceTimersByTimeAsync(10);
			const result = await promise;

			expect(result).toHaveProperty("osStats");
			expect(result.osStats).toHaveProperty("freeMemoryBytes");
			expect(result.osStats).toHaveProperty("totalMemoryBytes");

			expect(result).toHaveProperty("memoryUsage");
			expect(result.memoryUsage).toHaveProperty("rss");
			expect(result.memoryUsage).toHaveProperty("heapTotal");
			expect(result.memoryUsage).toHaveProperty("heapUsed");
			expect(result.memoryUsage).toHaveProperty("external");
			expect(result.memoryUsage).toHaveProperty("arrayBuffers");

			expect(result).toHaveProperty("cpuUsage");
			expect(result.cpuUsage).toHaveProperty("userUsageMs");

			expect(result).toHaveProperty("v8HeapStats");
			expect(result.v8HeapStats).toHaveProperty("totalHeapSizeBytes");
			expect(result.v8HeapStats).toHaveProperty("usedHeapSizeBytes");
			expect(result.v8HeapStats).toHaveProperty("heapSizeLimitBytes");

			expect(typeof result.eventLoopDelayMs).toBe("number");
			expect(result.eventLoopDelayMs).toBeGreaterThanOrEqual(0);
			expect(typeof result.uptimeMs).toBe("number");
			expect(result.uptimeMs).toBeGreaterThan(0);
		});

		it("reads eventLoopDelay from real performance entries", async () => {
			jest.useRealTimers();
			const service = new DiagnosticService();

			// Call getSystemStats with real timers — slow but guarantees real perf entries
			const result = await service.getSystemStats();

			expect(typeof result.eventLoopDelayMs).toBe("number");
			expect(result.eventLoopDelayMs).toBeGreaterThanOrEqual(0);
			jest.useFakeTimers();
		});

		it.each([
			{ label: "empty entries array", entries: [] },
			{ label: "undefined entry in array", entries: [undefined] },
		])("defaults eventLoopDelayMs to 0 when $label", async ({ entries }) => {
			const service = new DiagnosticService();
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
