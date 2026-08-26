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
 * Formats a decimal value as a percentage string.
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @returns Formatted percentage string (e.g., "75.00%")
 * @example
 * formatPercentage(0.75)   // "75.00%"
 * formatPercentage(1)      // "100.00%"
 * formatPercentage(0.5432) // "54.32%"
 * formatPercentage(0.9999) // "99.99%"
 */
export const formatPercentage = (value: number): string => {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "0.00%";
	}
	return percentageFormatter.format(value);
};

/**
 * Formats a whole number percentage value as a percentage string.
 * @param value - Whole number percentage (e.g., 75 for 75%)
 * @returns Formatted percentage string (e.g., "75.00%")
 * @example
 * formatPercentageFromWhole(75)    // "75.00%"
 * formatPercentageFromWhole(100)   // "100.00%"
 * formatPercentageFromWhole(54.32) // "54.32%"
 */
export const formatPercentageFromWhole = (value: number): string => {
	return formatPercentage(value / 100);
};

export const getPercentage = (value: number, total: number) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};
