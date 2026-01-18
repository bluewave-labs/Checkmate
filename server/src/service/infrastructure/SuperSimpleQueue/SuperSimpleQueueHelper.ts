const SERVICE_NAME = "JobQueueHelper";
import type { Monitor } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { INetworkService, INotificationsService } from "@/service/index.js";
class SuperSimpleQueueHelper {
	static SERVICE_NAME = SERVICE_NAME;

	private db: any;
	private logger: any;
	private networkService: INetworkService;
	private statusService: any;
	private notificationService: any;
	private notificationsService: INotificationsService;
	private checkService: any;
	private buffer: any;

	constructor({
		db,
		logger,
		networkService,
		statusService,
		notificationService,
		notificationsService,
		checkService,
		buffer,
	}: {
		db: any;
		logger: any;
		networkService: INetworkService;
		statusService: any;
		notificationService: any;
		notificationsService: INotificationsService;
		checkService: any;
		buffer: any;
	}) {
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.notificationService = notificationService;
		this.checkService = checkService;
		this.buffer = buffer;
		this.notificationsService = notificationsService;
	}

	get serviceName() {
		return SuperSimpleQueueHelper.SERVICE_NAME;
	}

	getMonitorJob = () => {
		return async (monitor: Monitor) => {
			try {
				const monitorId = monitor.id;
				const teamId = monitor.teamId;
				if (!monitorId) {
					throw new AppError({ message: "No monitor id", service: SERVICE_NAME, method: "getMonitorJob" });
				}

				// Step 1.  Check for maintenacne window, if found, skip the check
				const maintenanceWindowActive = await this.isInMaintenanceWindow(monitorId, teamId);
				if (maintenanceWindowActive) {
					this.logger.debug({
						message: `Monitor ${monitorId} is in maintenance window`,
						service: SERVICE_NAME,
						method: "getMonitorJob",
					});
					return;
				}

				// Step 2.  Request monitor status
				const status = await this.networkService.requestStatus(monitor);
				if (!status) {
					throw new Error("No network response");
				}

				// Step 3.  Build check
				const check = await this.checkService.buildCheck(status);

				// Step 4 Add check to buffer
				this.buffer.addToBuffer({ check });

				// Step 4.  Update monitor status
				const statusChangeResult = await this.statusService.updateMonitorStatus(status, check);

				// Step 5 handle incidents and notifications
				if (statusChangeResult.statusChanged === true) {
					this.notificationsService.handleNotifications(monitor, status);
				}

				// this.notificationService
				// 	.handleNotifications({
				// 		...status,
				// 		monitor: statusChangeResult.monitor,
				// 		prevStatus: statusChangeResult.prevStatus,
				// 		statusChanged: statusChangeResult.statusChanged,
				// 	})
				// 	.catch((error: any) => {
				// 		this.logger.error({
				// 			message: error.message,
				// 			service: SERVICE_NAME,
				// 			method: "getMonitorJob",
				// 			details: `Error sending notifications for job ${monitor.id}: ${error.message}`,
				// 			stack: error.stack,
				// 		});
				// 	});
			} catch (error: any) {
				this.logger.warn({
					message: error.message,
					service: error.service || SERVICE_NAME,
					method: error.method || "getMonitorJob",
					stack: error.stack,
				});
				throw error;
			}
		};
	};

	async isInMaintenanceWindow(monitorId: string, teamId: string) {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByMonitorId({
			monitorId: monitorId,
			teamId: teamId,
		});
		// Check for active maintenance window:
		const maintenanceWindowIsActive = maintenanceWindows.reduce((acc: any, window: any) => {
			if (window.active) {
				const start = new Date(window.start);
				const end = new Date(window.end);
				const now = new Date();
				const repeatInterval = window.repeat || 0;

				// If start is < now and end > now, we're in maintenance
				if (start <= now && end >= now) return true;

				// If maintenance window was set in the past with a repeat,
				// we need to advance start and end to see if we are in range

				while (start < now && repeatInterval !== 0) {
					start.setTime(start.getTime() + repeatInterval);
					end.setTime(end.getTime() + repeatInterval);
					if (start <= now && end >= now) {
						return true;
					}
				}
				return false;
			}
			return acc;
		}, false);
		return maintenanceWindowIsActive;
	}
}

export default SuperSimpleQueueHelper;
