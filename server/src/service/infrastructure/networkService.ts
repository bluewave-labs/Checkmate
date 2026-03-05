import { HTTPError, RequestError } from "got";
import type { Got, Response } from "got";
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
import path from "path";
import { fileURLToPath } from "url";
import { MonitorStatusResponseOverrides } from "@/types/index.js";

import CacheableLookup from "cacheable-lookup";
import { ISettingsService } from "../system/settingsService.js";
import { ILogger } from "@/utils/logger.js";
import { IStatusProvider } from "./network/IStatusProvider.js";
const SERVICE_NAME = "NetworkService";

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
	private got: Got;
	private https: typeof import("https");
	private jmespath: { search: (data: unknown, expression: string) => unknown };
	private GameDig: { query: (options: { type: string; host: string; port?: number }) => Promise<{ ping?: number } & { [key: string]: unknown }> };
	private ping: typeof import("ping");
	private logger: ILogger;
	private Docker: typeof import("dockerode");
	private net: typeof import("net");
	private settingsService: ISettingsService;
	private grpc: typeof import("@grpc/grpc-js");
	private protoLoader: typeof import("@grpc/proto-loader");

	// New providers
	private pingProvider;
	private httpProvider;
	private pageSpeedProvider;
	private hardwareProvider;
	private dockerProvider;
	private portProvider;
	private gameProvider;

	private buildStatusResponse = <T>({
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
				code: this.NETWORK_ERROR,
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
				statusResponse.code = error?.response?.statusCode ?? this.NETWORK_ERROR;
				statusResponse.message = error.message;
				statusResponse.responseTime = error.timings?.phases?.total ?? 0;
				statusResponse.timings = error.timings;
			}
			return { ...statusResponse, ...(overrides ?? {}) } as MonitorStatusResponse<T>;
		}

		return {
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: monitor.type,
			status: response?.ok ?? false,
			code: response?.statusCode ?? this.NETWORK_ERROR,
			message: response?.statusMessage ?? "",
			responseTime: response?.timings?.phases?.total ?? 0,
			timings: response?.timings,
			payload: payload ?? response?.body,
			jsonPath,
			matchMethod,
			expectedValue,
			extracted,
			...(overrides ?? {}),
		} as MonitorStatusResponse<T>;
	};

	constructor(
		axios: AxiosStatic,
		got: Got,
		https: typeof import("https"),
		jmespath: { search: (data: unknown, expression: string) => unknown },
		GameDig: { query: (options: { type: string; host: string; port?: number }) => Promise<{ ping?: number } & { [key: string]: unknown }> },
		ping: typeof import("ping"),
		logger: ILogger,
		Docker: typeof import("dockerode"),
		net: typeof import("net"),
		settingsService: ISettingsService,
		grpc: typeof import("@grpc/grpc-js"),
		protoLoader: typeof import("@grpc/proto-loader"),

		// New providers
		pingProvider: IStatusProvider<PingStatusPayload>,
		httpProvider: IStatusProvider<HttpStatusPayload>,
		pagespeedProvider: IStatusProvider<PageSpeedStatusPayload>,
		hardwareProvider: IStatusProvider<HardwareStatusPayload>,
		dockerProvider: IStatusProvider<DockerStatusPayload>,
		portProvider: IStatusProvider<PortStatusPayload>,
		gameProvider: IStatusProvider<GameStatusPayload>
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
		this.https = https;
		this.jmespath = jmespath;
		this.GameDig = GameDig;
		this.ping = ping;
		this.logger = logger;
		this.Docker = Docker;
		this.net = net;
		this.settingsService = settingsService;
		this.grpc = grpc;
		this.protoLoader = protoLoader;

		// New providers
		this.pingProvider = pingProvider;
		this.httpProvider = httpProvider;
		this.pageSpeedProvider = pagespeedProvider;
		this.hardwareProvider = hardwareProvider;
		this.dockerProvider = dockerProvider;
		this.portProvider = portProvider;
		this.gameProvider = gameProvider;
		const cacheable = new CacheableLookup();

		this.got = got.extend({
			dnsCache: cacheable,
			timeout: {
				request: 30000,
			},
			retry: { limit: 1 },
		});
	}

	get serviceName(): string {
		return NetworkService.SERVICE_NAME;
	}

	// Helper functions
	private async timeRequest<T>(operation: () => Promise<T>): Promise<{ response: T | null; responseTime: number; error: unknown }> {
		const start = process.hrtime.bigint();
		try {
			const response = await operation();
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response, responseTime: elapsedMs, error: null };
		} catch (error) {
			const elapsedMs = Math.round(Number(process.hrtime.bigint() - start) / 1_000_000);
			return { response: null, responseTime: elapsedMs, error };
		}
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
				return await this.requestGrpc(monitor);
			default:
				return this.handleUnsupportedType(type);
		}
	}

	private async requestGrpc(monitor: Monitor): Promise<MonitorStatusResponse<GrpcStatusPayload>> {
		try {
			const { url, port, ignoreTlsErrors } = monitor;
			const grpcServiceName = monitor.grpcServiceName || "";

			if (!url) {
				throw new AppError({ message: "Monitor host is required", service: this.SERVICE_NAME, method: "requestGrpc" });
			}
			if (!port) {
				throw new AppError({ message: "Monitor port is required", service: this.SERVICE_NAME, method: "requestGrpc" });
			}

			const target = `${url}:${port}`;

			const currentFilePath = fileURLToPath(import.meta.url);
			const protoPath = path.join(path.dirname(currentFilePath), "protos", "health.proto");

			const packageDefinition = this.protoLoader.loadSync(protoPath, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			});
			const grpcObject = this.grpc.loadPackageDefinition(packageDefinition) as unknown as {
				grpc: {
					health: {
						v1: {
							Health: new (
								target: string,
								credentials: unknown
							) => {
								Check: (request: { service: string }, options: { deadline: Date }, callback: (err: unknown, response: unknown) => void) => void;
								close: () => void;
							};
						};
					};
				};
			};
			const healthService = grpcObject.grpc.health.v1.Health;

			let credentials;
			if (ignoreTlsErrors) {
				credentials = this.grpc.credentials.createSsl(null, null, null, {
					checkServerIdentity: () => undefined,
				});
			} else {
				credentials = this.grpc.credentials.createInsecure();
			}

			const client = new healthService(target, credentials);

			const TIMEOUT_MS = 10000;
			const deadline = new Date(Date.now() + TIMEOUT_MS);

			const grpcResponse = this.buildStatusResponse<GrpcStatusPayload>({
				monitor,
				overrides: {
					status: false,
					code: this.NETWORK_ERROR,
					message: "gRPC health check not executed",
				},
			});

			const { response, responseTime, error } = await this.timeRequest<GrpcStatusPayload>(() => {
				return new Promise<GrpcStatusPayload>((resolve, reject) => {
					client.Check({ service: grpcServiceName }, { deadline }, (err: unknown, response: unknown) => {
						client.close();

						if (err) {
							const grpcErr = err as { code?: number; details?: string; message?: string };
							const payload: GrpcStatusPayload = {
								grpcStatusCode: grpcErr.code ?? -1,
								grpcStatusName: this.getGrpcStatusName(grpcErr.code ?? -1),
								serviceName: grpcServiceName,
								servingStatus: "UNKNOWN",
							};
							const grpcError = new AppError({
								message: grpcErr.details || grpcErr.message || "gRPC error",
								service: this.SERVICE_NAME,
								method: "requestGrpc",
							}) as AppError & { grpcPayload?: GrpcStatusPayload; grpcCode?: number };
							grpcError.grpcPayload = payload;
							grpcError.grpcCode = grpcErr.code;
							reject(grpcError);
							return;
						}

						const resp = response as { status?: string } | undefined;
						const servingStatus = resp?.status ?? "UNKNOWN";
						resolve({
							grpcStatusCode: 0,
							grpcStatusName: "OK",
							serviceName: grpcServiceName,
							servingStatus,
						});
					});
				});
			});

			if (error) {
				const grpcError = error as AppError & { grpcPayload?: GrpcStatusPayload; grpcCode?: number };
				const payload = grpcError.grpcPayload;
				grpcResponse.status = false;
				grpcResponse.code = grpcError.grpcCode ?? this.NETWORK_ERROR;
				grpcResponse.message = grpcError.message ?? "gRPC health check failed";
				grpcResponse.responseTime = responseTime;
				grpcResponse.payload = payload ?? null;
				return grpcResponse;
			}

			const grpcPayload = response as GrpcStatusPayload;
			const isServing = grpcPayload.servingStatus === "SERVING";

			grpcResponse.status = isServing;
			grpcResponse.code = isServing ? 200 : this.NETWORK_ERROR;
			grpcResponse.message = isServing
				? `gRPC service healthy (${grpcPayload.servingStatus})`
				: `gRPC service unhealthy (${grpcPayload.servingStatus})`;
			grpcResponse.responseTime = responseTime;
			grpcResponse.payload = grpcPayload;

			return grpcResponse;
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing gRPC health check",
				service: this.SERVICE_NAME,
				method: "requestGrpc",
				details: { url: monitor.url, port: monitor.port, grpcServiceName: monitor.grpcServiceName },
			});
		}
	}

	private getGrpcStatusName(code: number): string {
		const statusNames: Record<number, string> = {
			0: "OK",
			1: "CANCELLED",
			2: "UNKNOWN",
			3: "INVALID_ARGUMENT",
			4: "DEADLINE_EXCEEDED",
			5: "NOT_FOUND",
			6: "ALREADY_EXISTS",
			7: "PERMISSION_DENIED",
			8: "RESOURCE_EXHAUSTED",
			9: "FAILED_PRECONDITION",
			10: "ABORTED",
			11: "OUT_OF_RANGE",
			12: "UNIMPLEMENTED",
			13: "INTERNAL",
			14: "UNAVAILABLE",
			15: "DATA_LOSS",
			16: "UNAUTHENTICATED",
		};
		return statusNames[code] || "UNKNOWN";
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
