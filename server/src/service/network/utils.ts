import type { HttpStatusCode } from "@/domain/monitors/monitor.type.js";

export const timeRequest = async <T>(operation: () => Promise<T>): Promise<{ response: T | null; responseTime: number; error: unknown }> => {
	const start = process.hrtime.bigint();
	try {
		const response = await operation();
		const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
		return { response, responseTime: elapsedMs, error: null };
	} catch (error) {
		const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
		return { response: null, responseTime: elapsedMs, error };
	}
};

export const isStatusUp = (statusCode: number | undefined, customUpCodes: HttpStatusCode[] = []): boolean => {
	if (statusCode === undefined) return false;
	return (statusCode >= 200 && statusCode < 300) || customUpCodes.includes(statusCode);
};
