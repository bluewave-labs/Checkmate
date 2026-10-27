import { Monitor, MonitorType } from "@/domain/monitors/monitor.type.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { IStatusProvider } from "./IStatusProvider.js";

export const HEARTBEAT_MISSED_CODE = 408;

export class HeartbeatProvider implements IStatusProvider<null> {
	readonly type = "heartbeat";
	supports = (type: MonitorType) => type === "heartbeat";

	// A heartbeat check job only ever runs if it is not pushed back (dead man's switch), so this provider always returns a down status
	handle = async (monitor: Monitor): Promise<MonitorStatusResponse<null>> => ({
		monitorId: monitor.id,
		teamId: monitor.teamId,
		type: "heartbeat",
		status: false,
		code: HEARTBEAT_MISSED_CODE,
		message: "Ping not received",
		responseTime: 0,
		payload: null,
	});
}
