import type { GroupedCheck, HasResponseTime, NormalizedCheck, NormalizedUptimeCheck } from "@/domain/checks/check.type.js";

export const getDateForRange = (dateRange: string): Date | undefined => {
	const now = Date.now();
	switch (dateRange) {
		case "recent":
			return new Date(now - 2 * 60 * 60 * 1000); // 2 hours
		case "hour":
			return new Date(now - 60 * 60 * 1000); // 1 hour
		case "day":
			return new Date(now - 24 * 60 * 60 * 1000); // 1 day
		case "week":
			return new Date(now - 7 * 24 * 60 * 60 * 1000); // 7 days
		case "month":
			return new Date(now - 30 * 24 * 60 * 60 * 1000); // 30 days
		case "all":
			return undefined;
		default:
			return undefined;
	}
};

const percentileBy = <T>(arr: T[], percentile: number, value: (item: T) => number): number => {
	const sorted = arr.slice().sort((a, b) => value(a) - value(b));
	const index = (percentile / 100) * (sorted.length - 1);
	const lower = Math.floor(index);
	const upper = lower + 1;
	const weight = index % 1;
	if (upper >= sorted.length) return value(sorted[lower]!);
	return value(sorted[lower]!) * (1 - weight) + value(sorted[upper]!) * weight;
};

const rescale = (raw: number, min: number, max: number, rangeMin: number, rangeMax: number): number => {
	const scaled = rangeMin + ((raw - min) * (rangeMax - rangeMin)) / (max - min);
	return Math.max(rangeMin, Math.min(rangeMax, scaled));
};

export const NormalizeData = <T extends HasResponseTime>(checks: T[], rangeMin: number, rangeMax: number): NormalizedCheck<T>[] => {
	const original = (check: T) => (typeof check.responseTime === "number" ? check.responseTime : 0);
	if (checks.length <= 1) {
		return checks.map((check) => ({ ...check, originalResponseTime: original(check) }));
	}
	const min = percentileBy(checks, 0, (c) => c.responseTime);
	const max = percentileBy(checks, 95, (c) => c.responseTime);
	return checks.map((check) => ({
		...check,
		responseTime: rescale(check.responseTime, min, max, rangeMin, rangeMax),
		originalResponseTime: original(check),
	}));
};

export const NormalizeDataUptimeDetails = <T extends GroupedCheck>(checks: T[], rangeMin: number, rangeMax: number): NormalizedUptimeCheck<T>[] => {
	const original = (check: T) => (typeof check.avgResponseTime === "number" ? check.avgResponseTime : 0);
	if (checks.length <= 1) {
		return checks.map((check) => ({ ...check, originalAvgResponseTime: original(check) }));
	}
	const min = percentileBy(checks, 0, (c) => c.avgResponseTime);
	const max = percentileBy(checks, 95, (c) => c.avgResponseTime);
	return checks.map((check) => ({
		...check,
		avgResponseTime: rescale(check.avgResponseTime, min, max, rangeMin, rangeMax),
		originalAvgResponseTime: original(check),
	}));
};
