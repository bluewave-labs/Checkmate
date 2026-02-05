import { IMaintenanceWindowsRepository, IMonitorsRepository } from "@/repositories/index.js";
import { ParseBoolean } from "@/utils/utils.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "maintenanceWindowService";

class MaintenanceWindowService {
	static SERVICE_NAME = SERVICE_NAME;
	private monitorsRepository: IMonitorsRepository;
	private maintenanceWindowsRepository: IMaintenanceWindowsRepository;

	constructor({
		monitorsRepository,
		maintenanceWindowsRepository,
	}: {
		monitorsRepository: IMonitorsRepository;
		maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	}) {
		this.monitorsRepository = monitorsRepository;
		this.maintenanceWindowsRepository = maintenanceWindowsRepository;
	}

	get serviceName() {
		return MaintenanceWindowService.SERVICE_NAME;
	}

	createMaintenanceWindow = async ({ teamId, body }: { teamId: string; body: any }) => {
		const monitorIds = body.monitors;
		const monitors = await this.monitorsRepository.findByIds(monitorIds);

		const unauthorizedMonitors = monitors.filter((monitor) => monitor.teamId !== teamId);

		if (unauthorizedMonitors.length > 0) {
			throw new AppError({
				message: "Unauthorized to create maintenance window for one or more monitors",
				service: SERVICE_NAME,
				method: "createMaintenanceWindow",
				status: 403,
			});
		}

		const dbTransactions = monitorIds.map((monitorId: string) => {
			return this.maintenanceWindowsRepository.create({
				teamId,
				monitorId,
				name: body.name,
				active: body.active ? body.active : true,
				duration: body.duration,
				durationUnit: body.durationUnit,
				repeat: body.repeat,
				start: body.start,
				end: body.end,
			});
		});
		await Promise.all(dbTransactions);
	};

	getMaintenanceWindowById = async ({ id, teamId }: { id: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.findById(id, teamId);
	};

	getMaintenanceWindowsByTeamId = async ({ teamId, query }: { teamId: string; query: any }) => {
		let { active, page, rowsPerPage, field, order } = query || {};

		active = typeof active === "undefined" ? undefined : ParseBoolean(active);
		page = parseInt(page) || 0;
		rowsPerPage = parseInt(rowsPerPage) || 10;

		const maintenanceWindows = await this.maintenanceWindowsRepository.findByTeamId(teamId, active, page, rowsPerPage, field, order);
		const maintenanceWindowCount = await this.maintenanceWindowsRepository.countByTeamId(teamId, active);
		return { maintenanceWindows, maintenanceWindowCount };
	};

	getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
	};

	deleteMaintenanceWindow = async ({ id, teamId }: { id: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.deleteById(id, teamId);
	};

	editMaintenanceWindow = async ({ id, teamId, body }: { id: string; teamId: string; body: any }) => {
		return await this.maintenanceWindowsRepository.updateById(id, teamId, body);
	};
}

export default MaintenanceWindowService;
