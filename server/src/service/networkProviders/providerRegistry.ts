import type { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import type { CheckContext, MonitorPayloadMap, MonitorStatusResponse } from "@/types/network.js";
import { NETWORK_ERROR } from "@/types/network.js";
import { IStatusProvider } from "./IStatusProvider.js";
const SERVICE_NAME = "ProviderRegistry";

export interface IProviderRegistry {
	probe<T extends MonitorType>(monitor: Monitor & { type: T }, ctx?: CheckContext): Promise<MonitorStatusResponse<MonitorPayloadMap[T]>>;
}

export class ProviderRegistry implements IProviderRegistry {
	static SERVICE_NAME = SERVICE_NAME;

	constructor(private providers: IStatusProvider<unknown>[]) {}

	async probe<T extends MonitorType>(monitor: Monitor & { type: T }, ctx?: CheckContext): Promise<MonitorStatusResponse<MonitorPayloadMap[T]>> {
		const provider = this.providers.find((p) => p.supports(monitor.type));
		if (!provider) {
			return this.handleUnsupportedType(monitor.type) as Promise<MonitorStatusResponse<MonitorPayloadMap[T]>>;
		}
		return provider.handle(monitor, ctx) as Promise<MonitorStatusResponse<MonitorPayloadMap[T]>>;
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
}
