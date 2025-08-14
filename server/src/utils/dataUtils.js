const calculatePercentile = (arr, percentile) => {
	const sorted = arr.slice().sort((a, b) => a.responseTime - b.responseTime);
	const index = (percentile / 100) * (sorted.length - 1);
	const lower = Math.floor(index);
	const upper = lower + 1;
	const weight = index % 1;
	if (upper >= sorted.length) return sorted[lower].responseTime;
	return sorted[lower].responseTime * (1 - weight) + sorted[upper].responseTime * weight;
};

const calculatePercentileUptimeDetails = (arr, percentile) => {
	const sorted = arr.slice().sort((a, b) => a.avgResponseTime - b.avgResponseTime);
	const index = (percentile / 100) * (sorted.length - 1);
	const lower = Math.floor(index);
	const upper = lower + 1;
	const weight = index % 1;
	if (upper >= sorted.length) return sorted[lower].avgResponseTime;
	return sorted[lower].avgResponseTime * (1 - weight) + sorted[upper].avgResponseTime * weight;
};

const NormalizeData = (checks, rangeMin, rangeMax) => {
	if (checks.length > 1) {
		// Get the 5th and 95th percentile
		const min = calculatePercentile(checks, 0);
		const max = calculatePercentile(checks, 95);
		const normalizedChecks = checks.map((check) => {
			const originalResponseTime = check.responseTime;
			// Normalize the response time between 1 and 100
			let normalizedResponseTime = rangeMin + ((check.responseTime - min) * (rangeMax - rangeMin)) / (max - min);

			// Put a floor on the response times so we don't have extreme outliers
			// Better visuals
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
const NormalizeDataUptimeDetails = (checks, rangeMin, rangeMax) => {
	if (checks.length > 1) {
		// Get the 5th and 95th percentile
		const min = calculatePercentileUptimeDetails(checks, 0);
		const max = calculatePercentileUptimeDetails(checks, 95);

		const normalizedChecks = checks.map((check) => {
			const originalResponseTime = check.avgResponseTime;
			// Normalize the response time between 1 and 100
			let normalizedResponseTime = rangeMin + ((check.avgResponseTime - min) * (rangeMax - rangeMin)) / (max - min);

			// Put a floor on the response times so we don't have extreme outliers
			// Better visuals
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
			return { ...check, originalResponseTime: check.responseTime };
		});
	}
};

const safelyParseFloat = (value, defaultValue = 0) => {
	if (value === null || typeof value === "undefined") {
		return defaultValue;
	}
	const stringValue = String(value).trim();

	if (typeof value === "number" && !isNaN(value)) {
		return value;
	}

	if (stringValue === "") {
		return defaultValue;
	}

	const parsedValue = parseFloat(stringValue);

	if (isNaN(parsedValue) || !isFinite(parsedValue)) {
		return defaultValue;
	}

	return parsedValue;
};

export { safelyParseFloat, calculatePercentile, NormalizeData, calculatePercentileUptimeDetails, NormalizeDataUptimeDetails };
