/**
 * Intl.NumberFormat instance for percentage formatting.
 * Reused across all formatting calls for performance.
 */
const percentageFormatter = new Intl.NumberFormat("en-US", {
	style: "percent",
	minimumFractionDigits: 1,
	maximumFractionDigits: 1,
});

/**
 * Formats a decimal value as a percentage string.
 * @param value - Decimal value (e.g., 0.75 for 75%)
 * @returns Formatted percentage string (e.g., "75.0%")
 * @example
 * formatPercentage(0.75)   // "75.0%"
 * formatPercentage(1)      // "100.0%"
 * formatPercentage(0.5432) // "54.3%"
 */
export const formatPercentage = (value: number): string => {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return "0.0%";
	}
	return percentageFormatter.format(value);
};

/**
 * Formats a whole number percentage value as a percentage string.
 * @param value - Whole number percentage (e.g., 75 for 75%)
 * @returns Formatted percentage string (e.g., "75.0%")
 * @example
 * formatPercentageFromWhole(75)    // "75.0%"
 * formatPercentageFromWhole(100)   // "100.0%"
 * formatPercentageFromWhole(54.32) // "54.3%"
 */
export const formatPercentageFromWhole = (value: number): string => {
	return formatPercentage(value / 100);
};

export const getPercentage = (value: number, total: number) => {
	if (!value || !total) return 0;
	return (value / total) * 100;
};
