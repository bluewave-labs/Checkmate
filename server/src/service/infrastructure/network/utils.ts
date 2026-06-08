import type { HttpStatusCode } from "@/types/monitor.js";

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

export const NETWORK_ERROR = 5000;
export const PING_ERROR = 5001;

export const isStatusUp = (statusCode: number | undefined, customUpCodes: HttpStatusCode[] = []): boolean => {
	if (statusCode === undefined) return false;
	return (statusCode >= 200 && statusCode < 300) || customUpCodes.includes(statusCode);
};
