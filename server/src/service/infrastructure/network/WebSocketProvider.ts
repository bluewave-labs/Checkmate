import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { WebSocketStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";
import type WebSocket from "ws";

type WebSocketConstructor = typeof WebSocket;

const SERVICE_NAME = "WebSocketProvider";
const TIMEOUT_MS = 10000;

export class WebSocketProvider implements IStatusProvider<WebSocketStatusPayload> {
	readonly type = "websocket";

	constructor(private WS: WebSocketConstructor) {}

	supports(type: MonitorType): boolean {
		return type === "websocket";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<WebSocketStatusPayload>> {
		try {
			const { url } = monitor;
			if (!url) {
				throw new Error("URL is required for WebSocket monitoring");
			}

			const { responseTime, error } = await timeRequest(async () => {
				return new Promise<{ connected: boolean }>((resolve, reject) => {
					const options: WebSocket.ClientOptions = {};
					if (monitor.ignoreTlsErrors) {
						options.rejectUnauthorized = false;
					}

					const ws = new this.WS(url, options);

					const timeout = setTimeout(() => {
						ws.close();
						reject(new Error("WebSocket connection timeout"));
					}, TIMEOUT_MS);

					ws.on("open", () => {
						clearTimeout(timeout);
						ws.close();
						resolve({ connected: true });
					});

					ws.on("error", (err: unknown) => {
						clearTimeout(timeout);
						ws.close();
						reject(err);
					});
				});
			});

			if (error) {
				const errorMessage = error instanceof Error ? error.message : "WebSocket check failed";
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message: errorMessage,
					responseTime: responseTime,
					timings: undefined,
					payload: { connected: false },
				};
			}

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				message: "WebSocket check successful",
				responseTime: responseTime,
				timings: undefined,
				payload: { connected: true },
			};
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing WebSocket check",
				status: 500,
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url },
			});
		}
	}
}
