/**
 * Intl.NumberFormat instance for percentage formatting.
 * Reused across all formatting calls for performance.
 *
 * Two decimals rather than one: at a single decimal every value above 99.95%
 * renders as "100.0%", so a period containing real downtime is reported as
 * flawless. It also collapses 99.9 / 99.95 / 99.99 — three materially
 * different SLA commitments — into the same figure.
 */
const percentageFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

/**
 * Formats a value as a percentage string with two decimals.
 * @param value - The value to format: a fraction (0.75 for 75%) by default,
 *   or a percentage (75 for 75%) when `isFraction` is false
 * @param options.isFraction - Whether `value` is a fraction (0–1) rather than
 *   a percentage (0–100). Defaults to true.
 * @param options.clampExtremes - Whether values that would round to "0.00%" or
 *   "100.00%" without being exactly 0 or 1 show as "0.01%" / "99.99%". Defaults to false.
 * @returns Formatted percentage string (e.g., "75.00%"), or "0.00%" for NaN
 * @example
 * formatPercentage(0.75)                         // "75.00%"
 * formatPercentage(1)                            // "100.00%"
 * formatPercentage(0.9999)                       // "99.99%"
 * formatPercentage(75, { isFraction: false })    // "75.00%"
 * formatPercentage(54.32, { isFraction: false }) // "54.32%"
 * formatPercentage(0.99999, { clampExtremes: true }) // "99.99%"
 */
export const formatPercentage = (
	value: number,
	{
		isFraction = true,
		clampExtremes = false,
	}: { isFraction?: boolean; clampExtremes?: boolean } = {}
): string => {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "0.00%";
	}
	if (!isFraction) value /= 100;
	if (clampExtremes) {
		if (value > 0 && value < 0.00005) return "0.01%";
		if (value < 1 && value >= 0.99995) return "99.99%";
	}
	return percentageFormatter.format(value);
};

/**
 * Formats a number with locale-specific grouping.
 * @param value - Number to format
 * @param locale - App language (e.g., "en", "de")
 * @returns Formatted number string
 * @example
 * formatNumber(1234, "en") // "1,234"
 * formatNumber(1234, "de") // "1.234"
 */
export const formatNumber = (value: number, locale: string): string => {
	return new Intl.NumberFormat(locale).format(value);
};

export const getPercentage = (value: number, total: number) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};

/**
 * Formats a version string with exactly one leading "v".
 * Release tags are usually "v3.14.0" but not always, and the build version has no prefix.
 * @example
 * formatVersion("3.14.0")  // "v3.14.0"
 * formatVersion("v3.14.0") // "v3.14.0"
 */
export const formatVersion = (version: string): string => version.replace(/^v?/, "v");

// Shown wherever a value is not available for the current data source.
export const PLACEHOLDER = "—";
