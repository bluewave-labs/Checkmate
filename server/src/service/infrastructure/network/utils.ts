import { HTTPError, RequestError } from "got";
import type { Response } from "got";
import type { Monitor } from "@/types/monitor.js";
import { MonitorStatusResponse, MonitorStatusResponseOverrides } from "@/types/network.js";

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

interface BuildStatusResponseArgs<T> {
	monitor: Monitor;
	response?: Response<T> | null;
	error?: Error | RequestError | HTTPError | null;
	payload?: T | null;
	jsonPath?: string;
	matchMethod?: MonitorStatusResponse["matchMethod"];
	expectedValue?: string;
	extracted?: unknown;
	overrides?: MonitorStatusResponseOverrides<T>;
}

export const buildStatusResponse = <T>({
	monitor,
	response,
	error,
	payload,
	jsonPath,
	matchMethod,
	expectedValue,
	extracted,
	overrides,
}: BuildStatusResponseArgs<T>): MonitorStatusResponse<T> => {
	if (error) {
		const statusResponse: MonitorStatusResponse<T> = {
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: monitor.type,
			status: false,
			code: NETWORK_ERROR,
			message: error.message ?? "Network error",
			responseTime: 0,
			timings: undefined,
			jsonPath,
			matchMethod,
			expectedValue,
			extracted,
			payload,
		};

		if (error instanceof HTTPError || error instanceof RequestError) {
			statusResponse.code = error?.response?.statusCode ?? NETWORK_ERROR;
			statusResponse.message = error.message;
			statusResponse.responseTime = error.timings?.phases?.total ?? 0;
			statusResponse.timings = error.timings;
		}
		return { ...statusResponse, ...(overrides ?? {}) };
	}

	return {
		monitorId: monitor.id,
		teamId: monitor.teamId,
		type: monitor.type,
		status: response?.ok ?? false,
		code: response?.statusCode ?? NETWORK_ERROR,
		message: response?.statusMessage ?? "",
		responseTime: response?.timings?.phases?.total ?? 0,
		timings: response?.timings,
		payload: payload ?? response?.body,
		jsonPath,
		matchMethod,
		expectedValue,
		extracted,
	};
};
