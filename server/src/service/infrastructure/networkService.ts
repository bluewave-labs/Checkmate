import type { Got } from "got";
import type {
	Monitor,
	MonitorStatusResponse,
	GrpcStatusPayload,
	PageSpeedStatusPayload,
	HttpStatusPayload,
	HardwareStatusPayload,
	PingStatusPayload,
	DockerStatusPayload,
	PortStatusPayload,
	GameStatusPayload,
} from "@/types/index.js";
import type { AxiosStatic } from "axios";
import { AppError } from "@/utils/AppError.js";

import { ISettingsService } from "../system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import { IStatusProvider } from "./network/IStatusProvider.js";
const SERVICE_NAME = "NetworkService";

export interface INetworkService {
	readonly serviceName: string;
	requestStatus(
		monitor: Monitor
	): Promise<
		MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
		>
	>;
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

class NetworkService implements INetworkService {
	static SERVICE_NAME = SERVICE_NAME;

	private TYPE_PING: string;
	private TYPE_HTTP: string;
	private TYPE_PAGESPEED: string;
	private TYPE_HARDWARE: string;
	private TYPE_DOCKER: string;
	private TYPE_PORT: string;
	private TYPE_GAME: string;
	private TYPE_GRPC: string;
	private SERVICE_NAME: string;
	private NETWORK_ERROR: number;
	private PING_ERROR: number;

	private axios: AxiosStatic;
	private logger: ILogger;
	private pingProvider;
	private httpProvider;
	private pageSpeedProvider;
	private hardwareProvider;
	private dockerProvider;
	private portProvider;
	private gameProvider;
	private grpcProvider;

	constructor(
		axios: AxiosStatic,
		logger: ILogger,
		pingProvider: IStatusProvider<PingStatusPayload>,
		httpProvider: IStatusProvider<HttpStatusPayload>,
		pagespeedProvider: IStatusProvider<PageSpeedStatusPayload>,
		hardwareProvider: IStatusProvider<HardwareStatusPayload>,
		dockerProvider: IStatusProvider<DockerStatusPayload>,
		portProvider: IStatusProvider<PortStatusPayload>,
		gameProvider: IStatusProvider<GameStatusPayload>,
		grpcProvider: IStatusProvider<GrpcStatusPayload>
	) {
		this.TYPE_PING = "ping";
		this.TYPE_HTTP = "http";
		this.TYPE_PAGESPEED = "pagespeed";
		this.TYPE_HARDWARE = "hardware";
		this.TYPE_DOCKER = "docker";
		this.TYPE_PORT = "port";
		this.TYPE_GAME = "game";
		this.TYPE_GRPC = "grpc";
		this.SERVICE_NAME = SERVICE_NAME;
		this.NETWORK_ERROR = 5000;
		this.PING_ERROR = 5001;
		this.axios = axios;
		this.logger = logger;

		this.pingProvider = pingProvider;
		this.httpProvider = httpProvider;
		this.pageSpeedProvider = pagespeedProvider;
		this.hardwareProvider = hardwareProvider;
		this.dockerProvider = dockerProvider;
		this.portProvider = portProvider;
		this.gameProvider = gameProvider;
		this.grpcProvider = grpcProvider;
	}

	get serviceName(): string {
		return NetworkService.SERVICE_NAME;
	}

	// Main entry point
	async requestStatus(
		monitor: Monitor
	): Promise<
		MonitorStatusResponse<
			| PingStatusPayload
			| HttpStatusPayload
			| PageSpeedStatusPayload
			| HardwareStatusPayload
			| DockerStatusPayload
			| PortStatusPayload
			| GameStatusPayload
			| GrpcStatusPayload
		>
	> {
		const type = monitor?.type || "unknown";
		switch (type) {
			case this.TYPE_PING:
				return await this.pingProvider.handle(monitor);
			case this.TYPE_HTTP:
				return await this.httpProvider.handle(monitor);
			case this.TYPE_PAGESPEED:
				return await this.pageSpeedProvider.handle(monitor);
			case this.TYPE_HARDWARE:
				return await this.hardwareProvider.handle(monitor);
			case this.TYPE_DOCKER:
				return await this.dockerProvider.handle(monitor);
			case this.TYPE_PORT:
				return await this.portProvider.handle(monitor);
			case this.TYPE_GAME:
				return await this.gameProvider.handle(monitor);
			case this.TYPE_GRPC:
				return await this.grpcProvider.handle(monitor);
			default:
				return this.handleUnsupportedType(type);
		}
	}

	private async handleUnsupportedType(type: string): Promise<MonitorStatusResponse> {
		return {
			monitorId: "unknown",
			teamId: "unknown",
			type: "unknown",
			status: false,
			code: this.NETWORK_ERROR,
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
				service: this.SERVICE_NAME,
				method: "requestWebhook",
			});

			if (err && typeof err === "object" && "response" in err) {
				const axiosError = err as { response?: { status?: number; data?: unknown } };
				return {
					type: "webhook",
					status: false,
					code: axiosError.response?.status ?? this.NETWORK_ERROR,
					message: `Failed to send ${type} notification`,
					payload: axiosError.response?.data,
				};
			}

			return {
				type: "webhook",
				status: false,
				code: this.NETWORK_ERROR,
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
				service: this.SERVICE_NAME,
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
					service: this.SERVICE_NAME,
					method: "requestMatrix",
				});

				if (err && typeof err === "object" && "response" in err) {
					const axiosError = err as { response?: { status?: number; data?: unknown } };
					return {
						status: false,
						code: axiosError.response?.status || this.NETWORK_ERROR,
						message: "Failed to send Matrix notification",
						payload: axiosError.response?.data,
					};
				}
			}

			this.logger.warn({
				message: String(err),
				service: this.SERVICE_NAME,
				method: "requestMatrix",
			});

			return {
				status: false,
				code: this.NETWORK_ERROR,
				message: "Failed to send Matrix notification",
			};
		}
	}
}

export default NetworkService;
