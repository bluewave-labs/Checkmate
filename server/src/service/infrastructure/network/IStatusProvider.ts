import { Monitor, MonitorType } from "@/types/monitor.js";
import { MonitorStatusResponse } from "@/types/network.js";

export interface IStatusProvider<T> {
	type: string;
	supports: (type: MonitorType) => boolean;
	handle(monitor: Monitor): Promise<MonitorStatusResponse<T>>;
}
