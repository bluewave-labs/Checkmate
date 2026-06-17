import { Monitor } from "@/domain/monitors/monitor.types.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "@/service/bufferService.js";
import { AppError } from "@/utils/AppError.js";
import { supportsGeoCheck } from "@/domain/monitors/monitor.types.js";
import { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { ICheckProducer } from "@/worker/worker.check-producer.js";
import { ICheckEvaluator } from "@/worker/worker.check-evaluator.js";

const SERVICE_NAME = "CheckPipeline";

export interface ICheckPipeline {
	run(monitor: Monitor): Promise<MonitorEvaluation | null>; // null = skipped
}

export class CheckPipeline implements ICheckPipeline {
	constructor(
		private checkProducer: ICheckProducer,
		private checkEvaluator: ICheckEvaluator
	) {}

	run = async (monitor: Monitor): Promise<MonitorEvaluation | null> => {
		const checkResult = await this.checkProducer.produce(monitor);
		if (!checkResult) {
			return null; // skipped due to maintenance / geo guards / other guards
		}
		const evaluation = await this.checkEvaluator.evaluate(checkResult.status, checkResult.check);
		return evaluation;
	};
}

export class GeoChecksPipeline implements ICheckPipeline {
	constructor(
		private maintenanceWindowsRepository: IMaintenanceWindowsRepository,
		private geoChecksService: IGeoChecksService,
		private bufferService: IBufferService,
		private logger: ILogger
	) {}

	private async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const maintenanceWindows = await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		const now = new Date();
		return maintenanceWindows.some((window) => isWindowActive(window, now));
	}

	run = async (monitor: Monitor): Promise<MonitorEvaluation | null> => {
		// ****************************
		// Step 1:  Acquire
		// ****************************

		// Step 1a: Guards - skip if unsupported or not enabled

		if (!monitor.id) {
			throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "getHeartbeatGeoJob" });
		}

		if (!monitor.geoCheckEnabled) {
			return null;
		}
		if (!supportsGeoCheck(monitor.type)) {
			this.logger.debug({
				message: `Monitor ${monitor.id} type does not support geo checks, skipping`,
				service: SERVICE_NAME,
				method: "runGeoChecksPipeline",
			});
			return null;
		}

		if (!monitor.geoCheckLocations || monitor.geoCheckLocations.length === 0) {
			this.logger.warn({
				message: `No geo check locations configured for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "runGeoChecksPipeline",
			});
			return null;
		}

		// Step 1b: Maintenance window check
		const maintenanceWindowActive = await this.isInMaintenanceWindow(monitor.id, monitor.teamId);
		if (maintenanceWindowActive) {
			this.logger.debug({
				message: `Monitor ${monitor.id} is in maintenance window, skipping geo check`,
				service: SERVICE_NAME,
				method: "runGeoChecksPipeline",
			});
			return null;
		}

		// ****************************
		// Step 2: Record
		// ****************************

		// Step 2a: Build geo check, return null if fail
		const geoCheck = await this.geoChecksService.buildGeoCheck(monitor);
		if (!geoCheck) {
			this.logger.warn({
				message: `No geo check could be built for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "runGeoChecksPipeline",
			});
			return null;
		}

		// Step 2b: Add  to buffer
		this.bufferService.addGeoCheckToBuffer(geoCheck);

		this.logger.debug({
			message: `Geo check job executed for monitor ${monitor.id}`,
			service: SERVICE_NAME,
			method: "runGeoChecksPipeline",
		});
		return null;
	};
}
