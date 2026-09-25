import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { CheckContext } from "@/types/network.js";
export interface IStatusProvider<T> {
	type: string;
	supports: (type: MonitorType) => boolean;
	handle(monitor: Monitor, ctx?: CheckContext): Promise<MonitorStatusResponse<T>>;
}
