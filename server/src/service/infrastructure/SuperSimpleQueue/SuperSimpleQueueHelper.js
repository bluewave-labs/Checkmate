const SERVICE_NAME = "JobQueueHelper";

class SuperSimpleQueueHelper {
	static SERVICE_NAME = SERVICE_NAME;

	/**
	 * @param {{
	 * 	db: import("../database").Database,
	 * 	logger: import("../logger").Logger,
	 * 	networkService: import("../networkService").NetworkService,
	 * 	statusService: import("../statusService").StatusService,
	 * 	notificationService: import("../notificationService").NotificationService
	 * }}
	 */
	constructor({ db, logger, networkService, statusService, notificationService }) {
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.notificationService = notificationService;
	}

	get serviceName() {
		return SuperSimpleQueueHelper.SERVICE_NAME;
	}

	getMonitorJob = () => {
		return async (monitor) => {
			try {
				const monitorId = monitor._id;
				if (!monitorId) {
					throw new Error("No monitor id");
				}

				const maintenanceWindowActive = await this.isInMaintenanceWindow(monitorId);
				if (maintenanceWindowActive) {
					this.logger.info({
						message: `Monitor ${monitorId} is in maintenance window`,
						service: SERVICE_NAME,
						method: "getMonitorJob",
					});
					return;
				}
				const networkResponse = await this.networkService.requestStatus(monitor);

				if (!networkResponse) {
					throw new Error("No network response");
				}

				const { monitor: updatedMonitor, statusChanged, prevStatus } = await this.statusService.updateStatus(networkResponse);

				this.notificationService
					.handleNotifications({
						...networkResponse,
						monitor: updatedMonitor,
						prevStatus,
						statusChanged,
					})
					.catch((error) => {
						this.logger.error({
							message: error.message,
							service: SERVICE_NAME,
							method: "getMonitorJob",
							details: `Error sending notifications for job ${monitor._id}: ${error.message}`,
							stack: error.stack,
						});
					});
			} catch (error) {
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

	async isInMaintenanceWindow(monitorId) {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByMonitorId(monitorId);
		// Check for active maintenance window:
		const maintenanceWindowIsActive = maintenanceWindows.reduce((acc, window) => {
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

		// Update monitor's isInMaintenance property
		await this.updateMonitorMaintenanceStatus(monitorId, maintenanceWindowIsActive);

		return maintenanceWindowIsActive;
	}

	async updateMonitorMaintenanceStatus(monitorId, isInMaintenance) {
		try {
			await this.db.monitorModule.getMonitorByIdAndUpdate(monitorId, { isInMaintenance });
		} catch (error) {
			this.logger.error({
				message: `Failed to update maintenance status for monitor ${monitorId}`,
				error: error.message,
				service: SERVICE_NAME,
				method: "updateMonitorMaintenanceStatus",
			});
		}
	}
}

export default SuperSimpleQueueHelper;
