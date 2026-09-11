import { MonitorStatusResponse } from "@/types/network.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { Check } from "@/domain/checks/check.type.js";
import { Monitor } from "@/domain/monitors/monitor.type.js";
import { IMonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";
import { IStatusService } from "@/service/statusService.js";
import { MonitorActionDecision } from "@/worker/worker.helper.js";
import { ILogger } from "@/utils/logger.js";

export interface ICheckEvaluator {
	evaluate(status: MonitorStatusResponse, check: Check, monitor: Monitor): Promise<MonitorEvaluation>;
}

const SERVICE_NAME = "CheckEvaluator";

export class CheckEvaluator implements ICheckEvaluator {
	constructor(
		private statusService: IStatusService,
		private monitorStatusPolicy: IMonitorStatusPolicy,
		private logger: ILogger
	) {}

	// A check taken while the instance had no outbound connectivity says nothing about the target.
	// It is left out of the status window, running stats and monitor status entirely, so that no incident
	// opens for it and no spurious "resolved"/"up" fires once egress returns.
	private skipDegradedEgressCheck = (status: MonitorStatusResponse, check: Check, monitor: Monitor): MonitorEvaluation => {
		this.logger.debug({
			message: `Skipping evaluation of check ${check.id} for monitor ${monitor.id}: instance egress was degraded`,
			service: SERVICE_NAME,
			method: "evaluate",
		});
		const decision: MonitorActionDecision = {
			shouldCreateIncident: false,
			shouldResolveIncident: false,
			shouldSendNotification: false,
			incidentReason: null,
			notificationReason: null,
		};
		return {
			monitor,
			status,
			check,
			statusChange: { monitor, statusChanged: false, prevStatus: monitor.status, code: status.code, timestamp: Date.now() },
			decision,
		};
	};

	evaluate = async (status: MonitorStatusResponse, check: Check, monitor: Monitor) => {
		if (check.egressStatus === "degraded") {
			return this.skipDegradedEgressCheck(status, check, monitor);
		}

		// ****************************
		// Step 3:  Evaluate and return result to reactors
		// ****************************
		const statusChangeResult = await this.statusService.updateMonitorStatus(status, check, monitor);

		// Step 5.  Get decisions and create an evaluation obj
		const decision = this.monitorStatusPolicy.evaluate(statusChangeResult);
		const evaluation: MonitorEvaluation = {
			monitor: statusChangeResult.monitor,
			status,
			check,
			statusChange: statusChangeResult,
			decision,
		};
		return evaluation;
	};
}
