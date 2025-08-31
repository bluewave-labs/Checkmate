const SERVICE_NAME = "maintenanceWindowService";

class MaintenanceWindowService {
	static SERVICE_NAME = SERVICE_NAME;

	constructor({ db, settingsService, stringService, errorService }) {
		this.db = db;
		this.settingsService = settingsService;
		this.stringService = stringService;
		this.errorService = errorService;
	}

	get serviceName() {
		return MaintenanceWindowService.SERVICE_NAME;
	}

	createMaintenanceWindow = async ({ teamId, body }) => {
		const monitorIds = body.monitors;
		const monitors = await this.db.monitorModule.getMonitorsByIds(monitorIds);

		const unauthorizedMonitors = monitors.filter((monitor) => !monitor.teamId.equals(teamId));

		if (unauthorizedMonitors.length > 0) {
			throw this.errorService.createAuthorizationError();
		}

		const dbTransactions = monitorIds.map((monitorId) => {
			return this.db.maintenanceWindowModule.createMaintenanceWindow({
				teamId,
				monitorId,
				name: body.name,
				active: body.active ? body.active : true,
				repeat: body.repeat,
				start: body.start,
				end: body.end,
			});
		});
		await Promise.all(dbTransactions);
	};

	getMaintenanceWindowById = async ({ id, teamId }) => {
		const maintenanceWindow = await this.db.maintenanceWindowModule.getMaintenanceWindowById({ id, teamId });
		return maintenanceWindow;
	};

	getMaintenanceWindowsByTeamId = async ({ teamId, query }) => {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByTeamId(teamId, query);
		return maintenanceWindows;
	};

	getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }) => {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByMonitorId({ monitorId, teamId });
		return maintenanceWindows;
	};

	deleteMaintenanceWindow = async ({ id, teamId }) => {
		await this.db.maintenanceWindowModule.deleteMaintenanceWindowById({ id, teamId });
	};

	editMaintenanceWindow = async ({ id, teamId, body }) => {
		const editedMaintenanceWindow = await this.db.maintenanceWindowModule.editMaintenanceWindowById({ id, body, teamId });
		return editedMaintenanceWindow;
	};

	/**
	 * Updates the isInMaintenance property for all monitors based on their maintenance windows
	 * This method should be called periodically to keep maintenance status up to date
	 */
	updateAllMonitorsMaintenanceStatus = async () => {
		try {
			const monitors = await this.db.monitorModule.getAllMonitors();
			const updatePromises = monitors.map(async (monitor) => {
				const isInMaintenance = await this.isMonitorInMaintenanceWindow(monitor._id);
				if (monitor.isInMaintenance !== isInMaintenance) {
					await this.db.monitorModule.getMonitorByIdAndUpdate(monitor._id, { isInMaintenance });
				}
			});
			await Promise.all(updatePromises);
		} catch (error) {
			console.error("Failed to update monitors maintenance status:", error);
		}
	};

	/**
	 * Checks if a monitor is currently in a maintenance window
	 * Handles both one-time and repeating maintenance windows
	 */
	isMonitorInMaintenanceWindow = async (monitorId) => {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByMonitorId(monitorId);

		return maintenanceWindows.some((window) => {
			if (!window.active) return false;

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
		});
	};
}

export default MaintenanceWindowService;
