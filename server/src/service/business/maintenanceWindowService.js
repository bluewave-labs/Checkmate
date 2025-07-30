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
		const monitors = await this.db.getMonitorsByIds(monitorIds);

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
}

export default MaintenanceWindowService;
