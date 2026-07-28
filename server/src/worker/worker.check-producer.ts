import { Monitor } from "@/domain/monitors/monitor.type.js";
import { Check } from "@/domain/checks/check.type.js";
import { MonitorStatusResponse } from "@/types/network.js";
import { AppError } from "@/utils/AppError.js";
import { ILogger } from "@/utils/logger.js";
import { IBufferService } from "@/service/bufferService.js";
import { INetworkService } from "@/service/networkService.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";

export interface ICheckProducer {
	produce(monitor: Monitor): Promise<{ status: MonitorStatusResponse; check: Check } | null>;
}

const SERVICE_NAME = "CheckProducer";

export class CheckProducer implements ICheckProducer {
	constructor(
		private monitorsRepository: IMonitorsRepository,
		private maintenanceWindowsRepository: IMaintenanceWindowsRepository,
		private checkService: ICheckService,
		private networkService: INetworkService,
		private bufferService: IBufferService,
		private logger: ILogger
	) {}

	private async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const windows = await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
		const now = new Date();
		return windows.some((w) => isWindowActive(w, now));
	}

	produce = async (monitor: Monitor) => {
		if (!monitor.id) {
			throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "produce" });
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
				method: "produce",
			});
			if (monitor.status !== "maintenance") {
				// Clear the status window to avoid incidents being created on next check
				await this.monitorsRepository.updateById(monitor.id, monitor.teamId, { status: "maintenance", statusWindow: [] });
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
				method: "produce",
				details: { code: status.code, message: status.message },
			});
			return null;
		}
		// Step 2b: Add to buffer
		this.bufferService.addToBuffer(check);
		return { status, check };
	};
}
