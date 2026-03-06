import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { HardwareStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { HttpProvider } from "@/service/infrastructure/network/HttpProvider.js";
import { AppError } from "@/utils/AppError.js";

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
			throw new AppError({
				message: err instanceof Error ? err.message : "Error performing Hardware request",
				service: "HardwareProvider",
				method: "handle",
				details: { url: monitor.url },
			});
		}
	}
}
