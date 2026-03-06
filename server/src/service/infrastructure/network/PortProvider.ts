import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { PortStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";
import * as net from "net";
type NetType = typeof net;

const SERVICE_NAME = "PortProvider";

export class PortProvider implements IStatusProvider<PortStatusPayload> {
	readonly type = "port";

	constructor(private net: NetType) {}

	supports(type: MonitorType): boolean {
		return type === "port";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<PortStatusPayload>> {
		try {
			const { url, port } = monitor;
			if (!url || !port) {
				throw new Error("URL and port are required for port monitoring");
			}

			const { responseTime, error } = await timeRequest(async () => {
				return new Promise((resolve, reject) => {
					const socket = this.net.createConnection(
						{
							host: url,
							port,
						},
						() => {
							socket.end();
							socket.destroy();
							resolve({ success: true });
						}
					);

					socket.setTimeout(5000);
					socket.on("timeout", () => {
						socket.destroy();
						reject(new Error("Connection timeout"));
					});

					socket.on("error", (err: unknown) => {
						socket.destroy();
						reject(err);
					});
				});
			});
			if (error) {
				const errorMessage = error instanceof Error ? error.message : "Port check failed";
				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message: errorMessage,
					responseTime: responseTime,
					timings: undefined,
					payload: { success: false },
				};
			}

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: true,
				code: 200,
				message: "Port check successful",
				responseTime: responseTime,
				timings: undefined,
				payload: { success: true },
			};
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing port check",
				status: 500,
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url, port: monitor.port },
			});
		}
	}
}
