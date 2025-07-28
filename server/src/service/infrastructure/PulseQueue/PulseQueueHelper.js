const SERVICE_NAME = "PulseQueueHelper";

class PulseQueueHelper {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, logger, networkService, statusService, notificationService }) {
		this.db = db;
		this.logger = logger;
		this.networkService = networkService;
		this.statusService = statusService;
		this.notificationService = notificationService;
	}

	get serviceName() {
		return PulseQueueHelper.SERVICE_NAME;
	}

	getMonitorJob = () => {
		return async (job) => {
			try {
				const monitor = job.attrs.data.monitor;
				const monitorId = job.attrs.data.monitor._id;
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

				const networkResponse = await this.networkService.getStatus(monitor);

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
							details: `Error sending notifications for job ${job.id}: ${error.message}`,
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
		const maintenanceWindows = await this.db.getMaintenanceWindowsByMonitorId(monitorId);
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
		return maintenanceWindowIsActive;
	}
}

export default PulseQueueHelper;
