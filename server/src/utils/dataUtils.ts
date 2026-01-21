import type { Check, GroupedCheck, NormalizedCheck, NormalizedUptimeCheck } from "@/types/index.js";

const calculatePercentile = (arr: Check[], percentile: number): number => {
	const sorted = arr.slice().sort((a, b) => a.responseTime - b.responseTime);
	const index = (percentile / 100) * (sorted.length - 1);
	const lower = Math.floor(index);
	const upper = lower + 1;
	const weight = index % 1;
	if (upper >= sorted.length) return sorted[lower]!.responseTime;
	return sorted[lower]!.responseTime * (1 - weight) + sorted[upper]!.responseTime * weight;
};

const calculatePercentileUptimeDetails = (arr: GroupedCheck[], percentile: number): number => {
	const sorted = arr.slice().sort((a, b) => a.avgResponseTime - b.avgResponseTime);
	const index = (percentile / 100) * (sorted.length - 1);
	const lower = Math.floor(index);
	const upper = lower + 1;
	const weight = index % 1;
	if (upper >= sorted.length) return sorted[lower]!.avgResponseTime;
	return sorted[lower]!.avgResponseTime * (1 - weight) + sorted[upper]!.avgResponseTime * weight;
};

export const NormalizeData = <T extends Check>(checks: T[], rangeMin: number, rangeMax: number): NormalizedCheck<T>[] => {
	if (checks.length > 1) {
		const min = calculatePercentile(checks, 0);
		const max = calculatePercentile(checks, 95);
		const normalizedChecks = checks.map((check) => {
			const originalResponseTime = check.responseTime;
			let normalizedResponseTime = rangeMin + ((check.responseTime - min) * (rangeMax - rangeMin)) / (max - min);

			normalizedResponseTime = Math.max(rangeMin, Math.min(rangeMax, normalizedResponseTime));
			return {
				...check,
				responseTime: normalizedResponseTime,
				originalResponseTime: originalResponseTime,
			};
		});

		return normalizedChecks;
	} else {
		return checks.map((check) => {
			return { ...check, originalResponseTime: check.responseTime };
		});
	}
};

export const NormalizeDataUptimeDetails = <T extends GroupedCheck>(checks: T[], rangeMin: number, rangeMax: number): NormalizedUptimeCheck<T>[] => {
	if (checks.length > 1) {
		const min = calculatePercentileUptimeDetails(checks, 0);
		const max = calculatePercentileUptimeDetails(checks, 95);

		const normalizedChecks = checks.map((check) => {
			const originalResponseTime = check.avgResponseTime;
			let normalizedResponseTime = rangeMin + ((check.avgResponseTime - min) * (rangeMax - rangeMin)) / (max - min);

			normalizedResponseTime = Math.max(rangeMin, Math.min(rangeMax, normalizedResponseTime));
			return {
				...check,
				avgResponseTime: normalizedResponseTime,
				originalAvgResponseTime: originalResponseTime,
			};
		});

		return normalizedChecks;
	} else {
		return checks.map((check) => {
			return { ...check, originalAvgResponseTime: check.avgResponseTime };
		});
	}
};
