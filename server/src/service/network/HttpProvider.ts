import { type Got, HTTPError, RequestError } from "got";
import { IAdvancedMatcher } from "@/service/network/AdvancedMatcher.js";
import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import { HttpStatusPayload } from "@/types/network.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { Agent as HttpsAgent } from "https";
import { Agent as HttpAgent } from "http";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { isStatusUp } from "@/service/network/utils.js";
import { NETWORK_ERROR } from "@/types/network.js";
import CacheableLookup from "cacheable-lookup";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import { CheckContext } from "@/types/network.js";

export const PROXY_CONNECT_ERROR_CODES = new Set(["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "EAI_AGAIN", "EPIPE"]);

export class HttpProvider implements IStatusProvider<HttpStatusPayload> {
	readonly type = "http";

	// Shared, pooled agents reused across every check
	private static readonly PROXY_AGENT_CACHE_MAX = 50;
	private readonly proxyAgents = new Map<string, { http: HttpProxyAgent; https: HttpsProxyAgent }>();
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

	private proxyFailureMessage = (error: RequestError, proxyUrl: string): string | undefined => {
		if (error.response || !error.code || !PROXY_CONNECT_ERROR_CODES.has(error.code)) {
			return undefined;
		}
		const { hostname, port } = new URL(proxyUrl);
		return `Proxy connection failed (${hostname}:${port}): ${error.message}`;
	};

	private getProxyAgents(proxyUrl: string, ignoreTlsErrors: boolean) {
		const key = `${proxyUrl}|${ignoreTlsErrors}`;
		const hit = this.proxyAgents.get(key);
		// Agent already exists, refresh
		if (hit) {
			this.proxyAgents.delete(key); // Refresh
			this.proxyAgents.set(key, hit);
			return hit;
		}

		// Create new agents
		const agentOptions = { keepAlive: true, maxSockets: 256, maxFreeSockets: 256, proxy: proxyUrl };
		const pair = {
			http: new HttpProxyAgent(agentOptions),
			https: new HttpsProxyAgent({ ...agentOptions, rejectUnauthorized: !ignoreTlsErrors }),
		};

		// Cache agents
		this.proxyAgents.set(key, pair);
		if (this.proxyAgents.size > HttpProvider.PROXY_AGENT_CACHE_MAX) {
			const [oldestKey] = this.proxyAgents.keys(); // Destructuring gets the first inserted, ie oldest, item
			if (oldestKey === undefined) return pair;
			const oldest = this.proxyAgents.get(oldestKey);
			oldest?.http.destroy();
			oldest?.https.destroy();
			this.proxyAgents.delete(oldestKey);
		}
		return pair;
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

		// Return early for HEAD requests, no body to parse
		if (monitor.method === "HEAD") {
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: statusUp,
				code: statusCode,
				message,
				responseTime,
				timings,
				payload: body as T | string,
			};
		}

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

	private handleHttpError<T>(error: unknown, monitor: Monitor, ctx?: CheckContext): MonitorStatusResponse<T> {
		if (error instanceof HTTPError || error instanceof RequestError) {
			const statusCode = error.response?.statusCode;
			const statusUp = isStatusUp(statusCode, monitor.customUpCodes);
			const responseTime = error.timings?.phases?.total ?? 0;

			if (!statusUp) {
				const message = (ctx?.proxyUrl && error instanceof RequestError && this.proxyFailureMessage(error, ctx.proxyUrl)) || error.message;

				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: statusCode ?? NETWORK_ERROR,
					message: message,
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

	async handle<T>(monitor: Monitor, ctx?: CheckContext): Promise<MonitorStatusResponse<T>> {
		const { url, secret, ignoreTlsErrors } = monitor;

		if (!url) {
			throw new Error("URL is required for HTTP monitor");
		}

		const options: Record<string, unknown> = {
			headers: monitor.secret ? { Authorization: `Bearer ${secret}` } : undefined,
		};

		options.agent = ctx?.proxyUrl
			? this.getProxyAgents(ctx.proxyUrl, Boolean(ignoreTlsErrors))
			: {
					http: this.httpAgent,
					https: ignoreTlsErrors ? this.httpsAgentInsecure : this.httpsAgent,
				};

		options.method = monitor.method;

		try {
			const response = await this.got<string>(url, options);
			const statusUp = isStatusUp(response.statusCode, monitor.customUpCodes);

			return this.buildResponse<T>(monitor, {
				body: response.body,
				contentType: response.headers["content-type"] || "",
				statusCode: response.statusCode,
				statusUp,
				message: response.statusMessage ?? "OK",
				responseTime: response.timings.phases.total ?? 0,
				timings: response.timings,
			});
		} catch (error: unknown) {
			return this.handleHttpError(error, monitor, ctx);
		}
	}
}
