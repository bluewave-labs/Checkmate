import { describe, expect, it } from "@jest/globals";
import { getDateForRange, getDateFormat, usesRollups } from "../../../src/utils/dataUtils.ts";
import { DateRanges, type DateRange } from "../../../src/types/query.ts";

describe("getDateForRange", () => {
	it.each([
		["recent", 2 * 60 * 60 * 1000],
		["hour", 60 * 60 * 1000],
		["day", 24 * 60 * 60 * 1000],
		["week", 7 * 24 * 60 * 60 * 1000],
		["month", 30 * 24 * 60 * 60 * 1000],
	])("returns now minus the %s window", (range, offsetMs) => {
		const before = Date.now();
		const result = getDateForRange(range as DateRange);
		const after = Date.now();

		expect(result).toBeInstanceOf(Date);
		expect(result.getTime()).toBeGreaterThanOrEqual(before - offsetMs);
		expect(result.getTime()).toBeLessThanOrEqual(after - offsetMs);
	});

	it("returns the epoch for 'all'", () => {
		expect(getDateForRange("all")).toEqual(new Date(0));
	});
});

describe("getDateFormat", () => {
	it.each([
		["recent", "%Y-%m-%dT%H:%M:00Z"],
		["hour", "%Y-%m-%dT%H:%M:00Z"],
		["day", "%Y-%m-%dT%H:00:00Z"],
		["week", "%Y-%m-%dT00:00:00Z"],
		["month", "%Y-%m-%dT00:00:00Z"],
		["all", "%Y-%m-%dT00:00:00Z"],
	])("returns the %s bucket format", (range, format) => {
		expect(getDateFormat(range as DateRange)).toBe(format);
	});

	it("has a format for every member of DateRanges", () => {
		for (const range of DateRanges) {
			expect(getDateFormat(range)).toMatch(/^%Y-%m-%d/);
		}
	});
});

describe("usesRollups", () => {
	it.each(["recent", "hour"] as const)("is false for the %s range, which charts per-minute buckets", (range) => {
		expect(usesRollups(range)).toBe(false);
	});

	it.each(["day", "week", "month", "all"] as const)("is true for the %s range", (range) => {
		expect(usesRollups(range)).toBe(true);
	});
});
