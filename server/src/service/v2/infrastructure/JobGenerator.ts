import { IMonitor } from "../../../db/v2/models/index.js";
import { INetworkService } from "./NetworkService.js";
import { ICheckService } from "../business/CheckService.js";
import { IMonitorStatsService } from "../business/MonitorStatsService.js";
import { IStatusService } from "./StatusService.js";
import { INotificationService } from "./NotificationService.js";
import { IMaintenanceService } from "../business/MaintenanceService.js";
import ApiError from "../../../utils/ApiError.js";

const SERVICE_NAME = "JobGeneratorV2";
export interface IJobGenerator {
	generateJob: () => (Monitor: IMonitor) => Promise<void>;
	generateCleanupJob: () => () => Promise<void>;
}

class JobGenerator implements IJobGenerator {
	static SERVICE_NAME = SERVICE_NAME;
	private networkService: INetworkService;
	private checkService: ICheckService;
	private monitorStatsService: IMonitorStatsService;
	private statusService: IStatusService;
	private notificationService: INotificationService;
	private maintenanceService: IMaintenanceService;

	constructor(
		networkService: INetworkService,
		checkService: ICheckService,
		monitorStatsService: IMonitorStatsService,
		statusService: IStatusService,
		notificationService: INotificationService,
		maintenanceService: IMaintenanceService
	) {
		this.networkService = networkService;
		this.checkService = checkService;
		this.monitorStatsService = monitorStatsService;
		this.statusService = statusService;
		this.notificationService = notificationService;
		this.maintenanceService = maintenanceService;
	}

	generateJob = () => {
		return async (monitor: IMonitor) => {
			try {
				const monitorId = monitor._id.toString();
				if (!monitorId) {
					throw new ApiError("No monitorID for creating job", 400);
				}

				// Check for active maintenance window, if found, skip the check
				const isInMaintenance = await this.maintenanceService.isInMaintenance(monitorId);
				if (isInMaintenance) {
					return;
				}

				const status = await this.networkService.requestStatus(monitor);
				const check = await this.checkService.buildCheck(status, monitor.type);
				await check.save();
				const [updatedMonitor, statusChanged] = await this.statusService.updateMonitorStatus(monitor, status);

				if (statusChanged) {
					await this.notificationService.handleNotifications(updatedMonitor);
				}
				await this.statusService.updateMonitorStats(updatedMonitor, status, statusChanged);
			} catch (error) {
				throw error;
			}
		};
	};

	generateCleanupJob = () => {
		return async () => {
			try {
				await this.checkService.cleanupOrphanedChecks();
				await this.monitorStatsService.cleanupOrphanedMonitorStats();
			} catch (error) {
				throw error;
			}
		};
	};
}

export default JobGenerator;
