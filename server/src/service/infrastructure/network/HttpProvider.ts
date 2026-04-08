import { type Got, HTTPError, RequestError } from "got";
import { IAdvancedMatcher } from "@/service/infrastructure/network/AdvancedMatcher.js";
import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { HttpStatusPayload } from "@/types/network.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { Agent as HttpsAgent } from "https";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { NETWORK_ERROR } from "@/service/infrastructure/network/utils.js";
// import CacheableLookup from "cacheable-lookup";

export class HttpProvider implements IStatusProvider<HttpStatusPayload> {
	readonly type = "http";

	constructor(
		private got: Got,
		private advancedMatcher: IAdvancedMatcher
	) {
		// const cacheable = new CacheableLookup({ maxTtl: 300, errorTtl: 30 });
		this.got = got.extend({
			// dnsCache: cacheable,
			timeout: {
				request: 30000,
			},
			retry: { limit: 1 },
		});
	}

	supports(type: MonitorType) {
		return type === "http";
	}

	private handleHttpError<T>(error: unknown, monitor: Monitor): MonitorStatusResponse<T> {
		if (error instanceof HTTPError || error instanceof RequestError) {
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: error.response?.statusCode ?? NETWORK_ERROR,
				message: error.message,
				responseTime: error.timings?.phases?.total ?? 0,
				timings: error.timings,
				payload: null as T,
			};
		}

		return {
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: monitor.type,
			status: false,
			code: NETWORK_ERROR,
			message: error instanceof Error ? error.message : String(error),
			responseTime: 0,
			payload: null as T,
		};
	}

	async handle<T>(monitor: Monitor): Promise<MonitorStatusResponse<T>> {
		const { url, secret, jsonPath, ignoreTlsErrors } = monitor;

		if (!url) {
			throw new Error("URL is required for HTTP monitor");
		}

		const options: Record<string, unknown> = {
			headers: monitor.secret ? { Authorization: `Bearer ${secret}` } : undefined,
		};

		options.agent = {
			https: new HttpsAgent({ rejectUnauthorized: !ignoreTlsErrors }),
		};

		try {
			const response = await this.got<string>(url, options);
			const contentType = response.headers["content-type"] || "";
			const isJson = contentType.includes("application/json");

			if (jsonPath && !isJson) {
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: response.statusCode,
					message: "Response is not JSON",
					responseTime: response.timings.phases.total ?? 0,
					timings: response.timings,
					payload: response.body as unknown as T,
				};
			}

			let payload: T;
			if (isJson) {
				try {
					payload = JSON.parse(response.body) as T;
				} catch {
					payload = response.body as unknown as T;
				}
			} else {
				payload = response.body as unknown as T;
			}

			const matchResult = this.advancedMatcher.validate<T>(payload, monitor);
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: response.ok && matchResult.ok,
				code: response.statusCode,
				message: matchResult.ok ? (response.statusMessage ?? "OK") : matchResult.message,
				responseTime: response.timings.phases.total ?? 0,
				timings: response.timings,
				payload,
				extracted: matchResult.extracted,
			};
		} catch (error: unknown) {
			return this.handleHttpError(error, monitor);
		}
	}
}
