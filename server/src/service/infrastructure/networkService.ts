import type { Monitor, MonitorStatusResponse } from "@/types/index.js";
import type { AxiosStatic } from "axios";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR } from "@/service/infrastructure/network/utils.js";
import { ILogger } from "@/utils/logger.js";
import { IStatusProvider } from "./network/IStatusProvider.js";
const SERVICE_NAME = "NetworkService";

export interface INetworkService {
	readonly serviceName: string;
	requestStatus(monitor: Monitor): Promise<MonitorStatusResponse<unknown>>;
	requestWebhook(
		type: string,
		url: string,
		body: unknown
	): Promise<{ type: string; status: boolean; code: number; message: string; payload?: unknown }>;
	requestPagerDuty(args: { message: string; routingKey: string; monitorUrl: string }): Promise<boolean>;
	requestMatrix(args: { homeserverUrl: string; accessToken: string; roomId: string; message: string }): Promise<{
		status: boolean;
		code: number;
		message: string;
		payload?: unknown;
	}>;
}

export class NetworkService implements INetworkService {
	static SERVICE_NAME = SERVICE_NAME;

	private axios: AxiosStatic;
	private logger: ILogger;

	constructor(
		axios: AxiosStatic,
		logger: ILogger,
		private providers: IStatusProvider<unknown>[]
	) {
		this.axios = axios;
		this.logger = logger;
	}

	get serviceName(): string {
		return NetworkService.SERVICE_NAME;
	}

	// Main entry point
	async requestStatus(monitor: Monitor) {
		const provider = this.providers.find((p) => p.supports(monitor.type));
		if (!provider) {
			return this.handleUnsupportedType(monitor.type);
		}
		return provider.handle(monitor);
	}

	private async handleUnsupportedType(type: string): Promise<MonitorStatusResponse> {
		return {
			monitorId: "unknown",
			teamId: "unknown",
			type: "unknown",
			status: false,
			code: NETWORK_ERROR,
			message: `Unsupported type: ${type}`,
		};
	}

	// Other network requests unrelated to monitoring:
	async requestWebhook(type: string, url: string, body: unknown) {
		try {
			const response = await this.axios.post(url, body, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				type: "webhook",
				status: true,
				code: response.status,
				message: `Successfully sent ${type} notification`,
				payload: response.data,
			};
		} catch (err: unknown) {
			this.logger.warn({
				message: err instanceof Error ? err.message : String(err),
				service: SERVICE_NAME,
				method: "requestWebhook",
			});

			if (err && typeof err === "object" && "response" in err) {
				const axiosError = err as { response?: { status?: number; data?: unknown } };
				return {
					type: "webhook",
					status: false,
					code: axiosError.response?.status ?? NETWORK_ERROR,
					message: `Failed to send ${type} notification`,
					payload: axiosError.response?.data,
				};
			}

			return {
				type: "webhook",
				status: false,
				code: NETWORK_ERROR,
				message: `Failed to send ${type} notification`,
			};
		}
	}

	async requestPagerDuty({ message, routingKey, monitorUrl }: { message: string; routingKey: string; monitorUrl: string }) {
		try {
			const response = await this.axios.post(`https://events.pagerduty.com/v2/enqueue`, {
				routing_key: routingKey,
				event_action: "trigger",
				payload: {
					summary: message,
					severity: "critical",
					source: monitorUrl,
					timestamp: new Date().toISOString(),
				},
			});

			if (response?.data?.status !== "success") return false;
			return true;
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);

			throw new AppError({
				message: originalMessage || "Error sending PagerDuty notification",
				service: SERVICE_NAME,
				method: "requestPagerDuty",
				details: {
					responseData: err && typeof err === "object" && "response" in err ? (err as { response?: { data?: unknown } }).response?.data : undefined,
				},
			});
		}
	}

	async requestMatrix({
		homeserverUrl,
		accessToken,
		roomId,
		message,
	}: {
		homeserverUrl: string;
		accessToken: string;
		roomId: string;
		message: string;
	}) {
		try {
			const url = `${homeserverUrl}/_matrix/client/v3/rooms/${roomId}/send/m.room.message?access_token=${accessToken}`;
			const body = {
				msgtype: "m.text",
				body: message,
				format: "org.matrix.custom.html",
				formatted_body: message,
			};
			const response = await this.axios.post(url, body, {
				headers: {
					"Content-Type": "application/json",
				},
			});

			return {
				status: true,
				code: response.status,
				message: "Successfully sent Matrix notification",
			};
		} catch (err: unknown) {
			if (err instanceof Error) {
				this.logger.warn({
					message: err.message,
					service: SERVICE_NAME,
					method: "requestMatrix",
				});

				if (err && typeof err === "object" && "response" in err) {
					const axiosError = err as { response?: { status?: number; data?: unknown } };
					return {
						status: false,
						code: axiosError.response?.status || NETWORK_ERROR,
						message: "Failed to send Matrix notification",
						payload: axiosError.response?.data,
					};
				}
			}

			this.logger.warn({
				message: String(err),
				service: SERVICE_NAME,
				method: "requestMatrix",
			});

			return {
				status: false,
				code: NETWORK_ERROR,
				message: "Failed to send Matrix notification",
			};
		}
	}
}
