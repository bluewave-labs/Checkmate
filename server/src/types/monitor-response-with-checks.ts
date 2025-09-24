import { IMonitor, IMonitorStats } from "../db/v2/models/index.js";

export interface MonitorWithChecksResponse {
	monitor: IMonitor;
	checks: Array<{
		_id: string;
		count: number;
		avgResponseTime: number;
	}>;
	stats: IMonitorStats;
}
