import { Monitor } from "@/domain/monitors/monitor.type.js";
import { JobHandler, MonitorEvaluation } from "@/worker/worker.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "@/service/bufferService.js";
import { AppError } from "@/utils/AppError.js";
import { supportsGeoCheck } from "@/domain/monitors/monitor.type.js";
import { IGeoChecksService } from "@/domain/geo-checks/geo-check.service.js";
import { Job } from "@/domain/jobs/job.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";

const SERVICE_NAME = "GeoChecksPipeline";

export interface IGeoChecksPipeline {
	handle: JobHandler;
	run(monitor: Monitor): Promise<MonitorEvaluation | null>; // null = skipped
}

export class GeoChecksPipeline implements IGeoChecksPipeline {
	constructor(
		private monitorsRepository: IMonitorsRepository,
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

	handle: JobHandler = async (job: Job) => {
		if (!job.refId) return;
		const monitor = await this.monitorsRepository.findByIdLean(job.refId);
		if (monitor) await this.run(monitor);
	};

	run = async (monitor: Monitor): Promise<MonitorEvaluation | null> => {
		// ****************************
		// Step 1:  Acquire
		// ****************************

		// Step 1a: Guards - skip if unsupported or not enabled

		if (!monitor.id) {
			throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "run" });
		}

		if (!monitor.geoCheckEnabled) {
			return null;
		}
		if (!supportsGeoCheck(monitor.type)) {
			this.logger.debug({
				message: `Monitor ${monitor.id} type does not support geo checks, skipping`,
				service: SERVICE_NAME,
				method: "run",
			});
			return null;
		}

		if (!monitor.geoCheckLocations || monitor.geoCheckLocations.length === 0) {
			this.logger.warn({
				message: `No geo check locations configured for monitor ${monitor.id}`,
				service: SERVICE_NAME,
				method: "run",
			});
			return null;
		}

		// Step 1b: Maintenance window check
		const maintenanceWindowActive = await this.isInMaintenanceWindow(monitor.id, monitor.teamId);
		if (maintenanceWindowActive) {
			this.logger.debug({
				message: `Monitor ${monitor.id} is in maintenance window, skipping geo check`,
				service: SERVICE_NAME,
				method: "run",
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
				method: "run",
			});
			return null;
		}

		// Step 2b: Add  to buffer
		this.bufferService.addGeoCheckToBuffer(geoCheck);

		this.logger.debug({
			message: `Geo check job executed for monitor ${monitor.id}`,
			service: SERVICE_NAME,
			method: "run",
		});
		return null;
	};
}
