import { Monitor, MonitorType } from "@/domain/monitors/monitor.types.js";
import { MonitorStatusResponse } from "@/types/network.js";

export interface IStatusProvider<T> {
	type: string;
	supports: (type: MonitorType) => boolean;
	handle(monitor: Monitor): Promise<MonitorStatusResponse<T>>;
}
