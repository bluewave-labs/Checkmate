import { Monitor } from "@/domain/monitors/monitor.types.js";
import { MonitorEvaluation } from "@/worker/worker.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import { ILogger } from "@/utils/logger.js";
import { INetworkService } from "@/service/networkService.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { IBufferService } from "@/service/bufferService.js";
import { IMonitorStatusPolicy } from "@/worker/worker.monitor-status-policy.js";
import { IStatusService } from "@/service/statusService.js";
import { AppError } from "@/utils/AppError.js";
import { supportsGeoCheck } from "@/domain/monitors/monitor.types.js";
import { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";

const SERVICE_NAME = "CheckPipeline";

export interface ICheckPipeline {
	run(monitor: Monitor): Promise<MonitorEvaluation | null>; // null = skipped
}

export class CheckPipeline implements ICheckPipeline {
	constructor(
		private monitorsRepository: IMonitorsRepository,
		private maintenanceWindowsRepository: IMaintenanceWindowsRepository,
		private checkService: ICheckService,
		private networkService: INetworkService,
		private bufferService: IBufferService,
		private monitorStatusPolicy: IMonitorStatusPolicy,
		private statusService: IStatusService,
		private logger: ILogger
	) {}

	private async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const maintenanceWindows = await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		const now = new Date();
		return maintenanceWindows.some((window) => isWindowActive(window, now));
	}

	run = async (monitor: Monitor): Promise<MonitorEvaluation | null> => {
		const monitorId = monitor.id;
		if (!monitorId) {
			throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "getMonitorJob" });
		}
		// ****************************
		// Step 1:  Acquire
		// ****************************

		// Step 1a:  Maintenance window gate - skip if in maintenance
		const maintenanceWindowActive = await this.isInMaintenanceWindow(monitor.id, monitor.teamId);
		if (maintenanceWindowActive) {
			this.logger.debug({
				message: `Monitor ${monitor.id} is in maintenance window`,
				service: SERVICE_NAME,
				method: "runCheckPipeline",
			});
			if (monitor.status !== "maintenance") {
				await this.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "maintenance" });
			}
			return null;
		}

		// Step 1b: Acquire status
		const status = await this.networkService.requestStatus(monitor);
		if (!status) {
			throw new Error("No network response");
		}

		// ****************************
		// Step 2: Record
		// ****************************

		// Step 2a:  Create & record a check, return null if fail
		const check = this.checkService.toCheck(status);
		if (!check) {
			this.logger.warn({
				message: `No check could be built for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "runCHeckPipeline",
				details: { code: status.code, message: status.message },
			});
			return null;
		}
		// Step 2b: Add to buffer
		this.bufferService.addToBuffer(check);

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
