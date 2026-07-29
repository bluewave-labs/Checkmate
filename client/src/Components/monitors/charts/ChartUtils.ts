export const computeYAxisCap = (values: number[]): number | undefined => {
	const sorted = values.slice().sort((a, b) => a - b);
	if (sorted.length < 2) return undefined;
	const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
	return p95 > 0 ? Math.ceil(p95 * 2) : undefined;
};
