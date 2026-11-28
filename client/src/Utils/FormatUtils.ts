import prettyBytes from "pretty-bytes";

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

const DEFAULT_LOCALE = "en-US";
const DEFAULT_MAX_FRACTION_DIGITS = 2;

interface FormatNumberOptions {
	locale?: string;
	minimumFractionDigits?: number;
	maximumFractionDigits?: number;
}

/**
 * Formats a number with grouping and a bounded number of decimals.
 * @param value - Number to format, or null when the value is not available
 * @param options.locale - App language (e.g., "en", "de"). Defaults to "en-US"
 * @param options.minimumFractionDigits - Decimals always shown. Defaults to 0
 * @param options.maximumFractionDigits - Decimals shown at most. Defaults to 2
 * @returns Formatted number string, or the placeholder for null
 * @example
 * formatNumber(1234, { locale: "en" })                 // "1,234"
 * formatNumber(1234, { locale: "de" })                 // "1.234"
 * formatNumber(3.6123)                                 // "3.61"
 * formatNumber(3.6, { minimumFractionDigits: 2 })      // "3.60"
 * formatNumber(3.6123, { maximumFractionDigits: 0 })   // "4"
 * formatNumber(null)                                   // "—"
 */
export const formatNumber = (
	value: number | null,
	{
		locale = DEFAULT_LOCALE,
		minimumFractionDigits = 0,
		maximumFractionDigits = DEFAULT_MAX_FRACTION_DIGITS,
	}: FormatNumberOptions = {}
): string => {
	if (value === null) {
		return PLACEHOLDER;
	}
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits,
		maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
	}).format(value);
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

const MHZ_PER_GHZ = 1000;
const FREQUENCY_DECIMALS = 2;

export const formatFrequency = (mhz: number | null): string => {
	if (mhz === null) {
		return PLACEHOLDER;
	}
	return `${(mhz / MHZ_PER_GHZ).toFixed(FREQUENCY_DECIMALS)} GHz`;
};

export const formatBytes = (bytes: number | null): string => {
	if (bytes === null) {
		return PLACEHOLDER;
	}
	return prettyBytes(bytes);
};

export const formatTemperature = (celsius: number | null): string => {
	if (celsius === null) {
		return PLACEHOLDER;
	}
	return `${celsius.toFixed(0)} °C`;
};
export const formatBytesPerSecond = (bytesPerSecond: number | null): string => {
	if (bytesPerSecond === null) {
		return PLACEHOLDER;
	}
	return `${prettyBytes(bytesPerSecond)}/s`;
};

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

export const formatCompactNumber = (value: number | null): string => {
	if (value === null) {
		return PLACEHOLDER;
	}
	return compactNumberFormatter.format(value);
};
