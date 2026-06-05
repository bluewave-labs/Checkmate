import { type Got, HTTPError, RequestError } from "got";
import { IAdvancedMatcher } from "@/service/infrastructure/network/AdvancedMatcher.js";
import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { HttpStatusPayload } from "@/types/network.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { NETWORK_ERROR, isStatusUp } from "@/service/infrastructure/network/utils.js";
import CacheableLookup from "cacheable-lookup";

export class HttpProvider implements IStatusProvider<HttpStatusPayload> {
	readonly type = "http";

	// Shared, pooled agents reused across every check
	private readonly httpAgent: HttpAgent;
	private readonly httpsAgent: HttpsAgent;
	private readonly httpsAgentInsecure: HttpsAgent;

	constructor(
		private got: Got,
		private advancedMatcher: IAdvancedMatcher
	) {
		const cacheable = new CacheableLookup({ maxTtl: 300, errorTtl: 30 });
		this.got = got.extend({
			dnsCache: cacheable,
			timeout: {
				request: 30000,
			},
			retry: { limit: 1 },
		});

		const agentOptions = { keepAlive: true, maxSockets: 256, maxFreeSockets: 256 };
		this.httpAgent = new HttpAgent(agentOptions);
		this.httpsAgent = new HttpsAgent({ ...agentOptions, rejectUnauthorized: true });
		this.httpsAgentInsecure = new HttpsAgent({ ...agentOptions, rejectUnauthorized: false });
	}

	supports(type: MonitorType) {
		return type === "http";
	}

	private buildResponse<T>(
		monitor: Monitor,
		opts: {
			body: string;
			contentType: string;
			statusCode: number;
			statusUp: boolean;
			message: string;
			responseTime: number;
			timings?: MonitorStatusResponse<T>["timings"];
		}
	): MonitorStatusResponse<T> {
		const { body, contentType, statusCode, statusUp, message, responseTime, timings } = opts;
		const isJson = contentType.includes("application/json");

		if (monitor.jsonPath && !isJson) {
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: false,
				code: statusCode,
				message: "Response is not JSON",
				responseTime,
				timings,
				payload: body,
			};
		}

		let payload: T | string;
		if (isJson) {
			try {
				payload = JSON.parse(body) as T;
			} catch {
				payload = body;
			}
		} else {
			payload = body;
		}

		const matchResult = this.advancedMatcher.validate<T | string>(payload, monitor);

		return {
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: monitor.type,
			status: statusUp && matchResult.ok,
			code: statusCode,
			message: matchResult.ok ? message : matchResult.message,
			responseTime,
			timings,
			payload,
			extracted: matchResult.extracted,
		};
	}

	private handleHttpError<T>(error: unknown, monitor: Monitor): MonitorStatusResponse<T> {
		if (error instanceof HTTPError || error instanceof RequestError) {
			const statusCode = error.response?.statusCode;
			const statusUp = isStatusUp(statusCode, monitor.customUpCodes);
			const responseTime = error.timings?.phases?.firstByte ?? error.timings?.phases?.total ?? 0;

			if (!statusUp) {
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: statusCode ?? NETWORK_ERROR,
					message: error.message,
					responseTime,
					timings: error.timings,
					payload: null as T,
				};
			}

			return this.buildResponse<T>(monitor, {
				body: (error.response?.body ?? "") as string,
				contentType: error.response?.headers?.["content-type"] || "",
				statusCode: statusCode ?? NETWORK_ERROR,
				statusUp,
				message: error.message,
				responseTime,
				timings: error.timings,
			});
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
		const { url, secret, ignoreTlsErrors } = monitor;

		if (!url) {
			throw new Error("URL is required for HTTP monitor");
		}

		const options: Record<string, unknown> = {
			headers: monitor.secret ? { Authorization: `Bearer ${secret}` } : undefined,
		};

		options.agent = {
			http: this.httpAgent,
			https: ignoreTlsErrors ? this.httpsAgentInsecure : this.httpsAgent,
		};

		try {
			const response = await this.got<string>(url, options);
			const statusUp = isStatusUp(response.statusCode, monitor.customUpCodes);

			return this.buildResponse<T>(monitor, {
				body: response.body,
				contentType: response.headers["content-type"] || "",
				statusCode: response.statusCode,
				statusUp,
				message: response.statusMessage ?? "OK",
				responseTime: response.timings.phases.firstByte ?? 0,
				timings: response.timings,
			});
		} catch (error: unknown) {
			return this.handleHttpError(error, monitor);
		}
	}
}
