import { IMonitorsRepository } from "@/repositories/index.js";

const SERVICE_NAME = "maintenanceWindowService";

class MaintenanceWindowService {
	static SERVICE_NAME = SERVICE_NAME;
	private db: any;
	private errorService: any;
	private monitorsRepository: IMonitorsRepository;

	constructor({ db, errorService, monitorsRepository }: { db: any; errorService: any; monitorsRepository: IMonitorsRepository }) {
		this.db = db;
		this.errorService = errorService;
		this.monitorsRepository = monitorsRepository;
	}

	get serviceName() {
		return MaintenanceWindowService.SERVICE_NAME;
	}

	createMaintenanceWindow = async ({ teamId, body }: { teamId: string; body: any }) => {
		const monitorIds = body.monitors;
		const monitors = await this.monitorsRepository.findByIds(monitorIds);

		const unauthorizedMonitors = monitors.filter((monitor) => monitor.teamId !== teamId);

		if (unauthorizedMonitors.length > 0) {
			throw this.errorService.createAuthorizationError();
		}

		const dbTransactions = monitorIds.map((monitorId: string) => {
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

	getMaintenanceWindowById = async ({ id, teamId }: { id: string; teamId: string }) => {
		const maintenanceWindow = await this.db.maintenanceWindowModule.getMaintenanceWindowById({ id, teamId });
		return maintenanceWindow;
	};

	getMaintenanceWindowsByTeamId = async ({ teamId, query }: { teamId: string; query: any }) => {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByTeamId(teamId, query);
		return maintenanceWindows;
	};

	getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		const maintenanceWindows = await this.db.maintenanceWindowModule.getMaintenanceWindowsByMonitorId({ monitorId, teamId });
		return maintenanceWindows;
	};

	deleteMaintenanceWindow = async ({ id, teamId }: { id: string; teamId: string }) => {
		await this.db.maintenanceWindowModule.deleteMaintenanceWindowById({ id, teamId });
	};

	editMaintenanceWindow = async ({ id, teamId, body }: { id: string; teamId: string; body: any }) => {
		const editedMaintenanceWindow = await this.db.maintenanceWindowModule.editMaintenanceWindowById({ id, body, teamId });
		return editedMaintenanceWindow;
	};
}

export default MaintenanceWindowService;
