import { MonitorStatusResponse } from "@/types/network.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { Check } from "@/domain/checks/check.type.js";
import { IMonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";
import { IStatusService } from "@/service/statusService.js";

export interface ICheckEvaluator {
	evaluate(status: MonitorStatusResponse, check: Check): Promise<MonitorEvaluation>;
}

export class CheckEvaluator implements ICheckEvaluator {
	constructor(
		private statusService: IStatusService,
		private monitorStatusPolicy: IMonitorStatusPolicy
	) {}
	evaluate = async (status: MonitorStatusResponse, check: Check) => {
		// ****************************
		// Step 3:  Evaluate and return result to reactors
		// ****************************
		const statusChangeResult = await this.statusService.updateMonitorStatus(status, check);

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
