import { PingStatusPayload } from "@/types/network.js";
import { IStatusProvider } from "./IStatusProvider.js";
import { MonitorType, Monitor } from "@/types/monitor.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import ping from "ping";
import { buildStatusResponse, timeRequest } from "@/service/infrastructure/network/utils.js";
const SERVICE_NAME = "PingProvider";

type Ping = typeof ping;

export class PingProvider implements IStatusProvider<PingStatusPayload> {
	readonly type = "ping";

	constructor(private ping: Ping) {}

	supports(type: MonitorType): boolean {
		return type === "ping";
	}

	private sanitizeHost(url: string): string {
		return url
			.replace(/^https?:\/\//, "")
			.replace(/\/.*$/, "")
			.replace(/:.*/, "");
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<PingStatusPayload>> {
		try {
			if (!monitor.url) {
				throw new Error("URL is required for ping monitor");
			}

			const sanitizedHost = this.sanitizeHost(monitor.url);
			const { response, error } = await timeRequest<PingStatusPayload>(() => this.ping.promise.probe(sanitizedHost));
			const safeTime = typeof response?.time === "number" ? response.time : parseFloat(String(response?.time)) || 0;
			if (error) {
				throw error;
			}

			if (!response) {
				throw new Error(`No response from ping for host: ${sanitizedHost}`);
			}

			return buildStatusResponse<PingStatusPayload>({
				monitor,
				payload: response,
				overrides: {
					status: response.alive ?? false,
					code: 200,
					message: "Success",
					responseTime: safeTime,
				},
			});
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message,
				service: SERVICE_NAME,
				method: "handle",
			});
		}
	}
}
