export const hasValues = <T>(buckets: T[], keys: (keyof T)[]) =>
	buckets.some((bucket) => keys.some((key) => bucket[key] !== null));
