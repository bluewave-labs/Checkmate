import { IStatusProvider } from "@/service/networkProviders/IStatusProvider.js";
import { HardwareStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { HttpProvider } from "@/service/networkProviders/HttpProvider.js";
import { AppError, internalError } from "@/utils/AppError.js";

const SERVICE_NAME = "HardwareProvider";

export class HardwareProvider implements IStatusProvider<HardwareStatusPayload> {
	readonly type = "hardware";
	constructor(private httpProvider: HttpProvider) {}

	supports(type: MonitorType) {
		return type === "hardware";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<HardwareStatusPayload>> {
		const { url } = monitor;
		try {
			if (!url) throw new Error("URL is required for Hardware monitor");
			return await this.httpProvider.handle<HardwareStatusPayload>(monitor);
		} catch (err: unknown) {
			throw new AppError(internalError, {
				message: err instanceof Error ? err.message : "Error performing Hardware request",
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url },
			});
		}
	}
}
