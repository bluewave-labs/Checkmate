import { describe, expect, it } from "@jest/globals";
import { getDateForRange, NormalizeData, NormalizeDataUptimeDetails } from "../../../src/utils/dataUtils.ts";
import type { GroupedCheck } from "../../../src/domain/checks/check.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeCheck = (responseTime: number, overrides?: Record<string, unknown>) => ({
	id: `check-${responseTime}`,
	status: true,
	responseTime,
	...overrides,
});

const makeGrouped = (avgResponseTime: number, overrides?: Partial<GroupedCheck>): GroupedCheck => ({
	bucketDate: `bucket-${avgResponseTime}`,
	avgResponseTime,
	totalChecks: 5,
	...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("getDateForRange", () => {
	it.each([
		["recent", 2 * 60 * 60 * 1000],
		["hour", 60 * 60 * 1000],
		["day", 24 * 60 * 60 * 1000],
		["week", 7 * 24 * 60 * 60 * 1000],
		["month", 30 * 24 * 60 * 60 * 1000],
	])("returns now minus the %s window", (range, offsetMs) => {
		const before = Date.now();
		const result = getDateForRange(range as string);
		const after = Date.now();

		expect(result).toBeInstanceOf(Date);
		expect(result!.getTime()).toBeGreaterThanOrEqual(before - offsetMs);
		expect(result!.getTime()).toBeLessThanOrEqual(after - offsetMs);
	});

	it("returns undefined for 'all'", () => {
		expect(getDateForRange("all")).toBeUndefined();
	});

	it("returns undefined for unknown ranges", () => {
		expect(getDateForRange("fortnight")).toBeUndefined();
	});
});

describe("NormalizeData", () => {
	// Fixture math: p0 of [100..500] is 100; p95 interpolates between the 4th and 5th
	// sorted values at weight 0.8 → 400*0.2 + 500*0.8 = 480. Values rescale into
	// [10, 100] via 10 + (rt - 100) * 90 / 380, clamped.
	it("rescales responseTime into [rangeMin, rangeMax] anchored to the p0–p95 window", () => {
		const checks = [100, 200, 300, 400, 500].map((rt) => makeCheck(rt));

		const result = NormalizeData(checks, 10, 100);

		expect(result[0]!.responseTime).toBe(10);
		expect(result[1]!.responseTime).toBeCloseTo(33.6842, 4);
		expect(result[2]!.responseTime).toBeCloseTo(57.3684, 4);
		expect(result[3]!.responseTime).toBeCloseTo(81.0526, 4);
	});

	it("clamps values above the p95 anchor to rangeMax", () => {
		const checks = [100, 200, 300, 400, 500].map((rt) => makeCheck(rt));

		const result = NormalizeData(checks, 10, 100);

		expect(result[4]!.responseTime).toBe(100);
	});

	it("preserves the raw value in originalResponseTime and spreads other fields", () => {
		const checks = [makeCheck(100, { message: "OK" }), makeCheck(500)];

		const result = NormalizeData(checks, 10, 100);

		expect(result[0]!.originalResponseTime).toBe(100);
		expect(result[1]!.originalResponseTime).toBe(500);
		expect(result[0]).toMatchObject({ id: "check-100", status: true, message: "OK" });
	});

	it("passes a single check through, only adding originalResponseTime", () => {
		const result = NormalizeData([makeCheck(250)], 10, 100);

		expect(result).toEqual([{ id: "check-250", status: true, responseTime: 250, originalResponseTime: 250 }]);
	});

	it("returns an empty array for empty input", () => {
		expect(NormalizeData([], 10, 100)).toEqual([]);
	});

	it("records originalResponseTime as 0 for a non-numeric responseTime (failed checks)", () => {
		const checks = [makeCheck(undefined as unknown as number), makeCheck(100), makeCheck(200)];

		const result = NormalizeData(checks, 10, 100);

		expect(result[0]!.originalResponseTime).toBe(0);
	});

	// Characterization, not endorsement: when every value is equal the p0–p95 window
	// has zero width and the rescale divides by zero. Fixing this is a planned
	// follow-up (docs/planning/dataUtils-generic-normalization-refactor.md); this
	// test pins the current behavior so the fix is a deliberate, visible change.
	it("produces NaN when all values are equal (division by zero — known edge case)", () => {
		const result = NormalizeData([makeCheck(50), makeCheck(50), makeCheck(50)], 10, 100);

		result.forEach((check) => {
			expect(check.responseTime).toBeNaN();
			expect(check.originalResponseTime).toBe(50);
		});
	});
});

describe("NormalizeDataUptimeDetails", () => {
	it("rescales avgResponseTime into [rangeMin, rangeMax] anchored to the p0–p95 window", () => {
		const checks = [100, 200, 300, 400, 500].map((avg) => makeGrouped(avg));

		const result = NormalizeDataUptimeDetails(checks, 10, 100);

		expect(result[0]!.avgResponseTime).toBe(10);
		expect(result[1]!.avgResponseTime).toBeCloseTo(33.6842, 4);
		expect(result[4]!.avgResponseTime).toBe(100);
	});

	it("preserves the raw value in originalAvgResponseTime and spreads other fields", () => {
		const checks = [makeGrouped(100), makeGrouped(500)];

		const result = NormalizeDataUptimeDetails(checks, 10, 100);

		expect(result[0]!.originalAvgResponseTime).toBe(100);
		expect(result[1]!.originalAvgResponseTime).toBe(500);
		expect(result[0]).toMatchObject({ bucketDate: "bucket-100", totalChecks: 5 });
	});

	it("passes a single bucket through, only adding originalAvgResponseTime", () => {
		const result = NormalizeDataUptimeDetails([makeGrouped(250)], 10, 100);

		expect(result).toEqual([{ bucketDate: "bucket-250", avgResponseTime: 250, totalChecks: 5, originalAvgResponseTime: 250 }]);
	});

	it("returns an empty array for empty input", () => {
		expect(NormalizeDataUptimeDetails([], 10, 100)).toEqual([]);
	});

	it("records originalAvgResponseTime as 0 for a null avgResponseTime ($avg over an empty bucket)", () => {
		const result = NormalizeDataUptimeDetails([makeGrouped(null as unknown as number)], 10, 100);

		expect(result[0]!.originalAvgResponseTime).toBe(0);
	});

	it("produces NaN when all values are equal (division by zero — known edge case)", () => {
		const result = NormalizeDataUptimeDetails([makeGrouped(50), makeGrouped(50)], 10, 100);

		result.forEach((check) => {
			expect(check.avgResponseTime).toBeNaN();
			expect(check.originalAvgResponseTime).toBe(50);
		});
	});
});
