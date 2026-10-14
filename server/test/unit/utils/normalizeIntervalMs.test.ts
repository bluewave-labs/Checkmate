import { normalizeIntervalMs, MIN_MONITOR_INTERVAL_MS } from "@/domain/monitors/monitor.type.js";

describe("normalizeIntervalMs", () => {
	it("returns 60000ms (1 minute) for null, undefined, or 0", () => {
		expect(normalizeIntervalMs(null)).toBe(60000);
		expect(normalizeIntervalMs(undefined)).toBe(60000);
		expect(normalizeIntervalMs(0)).toBe(60000);
		expect(normalizeIntervalMs(-10)).toBe(60000);
	});

	it("converts second-based intervals (< 10000) to milliseconds", () => {
		expect(normalizeIntervalMs(10)).toBe(10000); // 10s -> 10,000ms
		expect(normalizeIntervalMs(60)).toBe(60000); // 1m -> 60,000ms
		expect(normalizeIntervalMs(300)).toBe(300000); // 5m -> 300,000ms
		expect(normalizeIntervalMs(600)).toBe(600000); // 10m -> 600,000ms
		expect(normalizeIntervalMs(1800)).toBe(1800000); // 30m -> 1,800,000ms
		expect(normalizeIntervalMs(3600)).toBe(3600000); // 1h -> 3,600,000ms
	});

	it("converts 86400 (1 day in seconds) to 86400000 ms", () => {
		expect(normalizeIntervalMs(86400)).toBe(86400000);
	});

	it("preserves intervals already in milliseconds", () => {
		expect(normalizeIntervalMs(10000)).toBe(10000);
		expect(normalizeIntervalMs(60000)).toBe(60000);
		expect(normalizeIntervalMs(300000)).toBe(300000);
		expect(normalizeIntervalMs(1800000)).toBe(1800000);
		expect(normalizeIntervalMs(3600000)).toBe(3600000);
		expect(normalizeIntervalMs(86400000)).toBe(86400000);
	});
});
