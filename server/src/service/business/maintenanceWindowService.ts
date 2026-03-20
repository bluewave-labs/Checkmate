import { IMaintenanceWindowsRepository, IMonitorsRepository } from "@/repositories/index.js";
import type { DurationUnit, MaintenanceWindow } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "maintenanceWindowService";

export interface IMaintenanceWindowService {
	createMaintenanceWindow(params: {
		teamId: string;
		monitorIDs: string[];
		name: string;
		active: boolean;
		duration: number;
		durationUnit: DurationUnit;
		repeat: number;
		start: string;
		end: string;
	}): Promise<void>;
	getMaintenanceWindowById(params: { id: string; teamId: string }): Promise<MaintenanceWindow>;
	getMaintenanceWindowsByTeamId(params: {
		teamId: string;
		active?: boolean;
		page?: number;
		rowsPerPage?: number;
		field?: string;
		order?: string;
	}): Promise<{ maintenanceWindows: MaintenanceWindow[]; maintenanceWindowCount: number }>;
	getMaintenanceWindowsByMonitorId(params: { monitorId: string; teamId: string }): Promise<MaintenanceWindow[]>;
	deleteMaintenanceWindow(params: { id: string; teamId: string }): Promise<MaintenanceWindow>;
	editMaintenanceWindow(params: { id: string; teamId: string; body: Partial<MaintenanceWindow> }): Promise<MaintenanceWindow>;
}

export class MaintenanceWindowService implements IMaintenanceWindowService {
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

	createMaintenanceWindow = async ({
		teamId,
		monitorIDs,
		name,
		active,
		duration,
		durationUnit,
		repeat,
		start,
		end,
	}: {
		teamId: string;
		monitorIDs: string[];
		name: string;
		active: boolean;
		duration: number;
		durationUnit: DurationUnit;
		repeat: number;
		start: string;
		end: string;
	}) => {
		const monitors = await this.monitorsRepository.findByIds(monitorIDs);

		const unauthorizedMonitors = monitors.filter((monitor) => monitor.teamId !== teamId);

		if (unauthorizedMonitors.length > 0) {
			throw new AppError({
				message: "Unauthorized to create maintenance window for one or more monitors",
				service: SERVICE_NAME,
				method: "createMaintenanceWindow",
				status: 403,
			});
		}

		const dbTransactions = monitorIDs.map((monitorId: string) => {
			return this.maintenanceWindowsRepository.create({
				teamId,
				monitorId,
				name: name,
				active: active,
				duration: duration,
				durationUnit: durationUnit,
				repeat: repeat,
				start: start,
				end: end,
			});
		});
		await Promise.all(dbTransactions);
	};

	getMaintenanceWindowById = async ({ id, teamId }: { id: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.findById(id, teamId);
	};

	getMaintenanceWindowsByTeamId = async ({
		teamId,
		active,
		page,
		rowsPerPage,
		field,
		order,
	}: {
		teamId: string;
		active?: boolean;
		page?: number;
		rowsPerPage?: number;
		field?: string;
		order?: string;
	}) => {
		page = page ?? 0;
		rowsPerPage = rowsPerPage ?? 10;

		const maintenanceWindows = await this.maintenanceWindowsRepository.findByTeamId(teamId, page, rowsPerPage, field, order, active);
		const maintenanceWindowCount = await this.maintenanceWindowsRepository.countByTeamId(teamId, active);
		return { maintenanceWindows, maintenanceWindowCount };
	};

	getMaintenanceWindowsByMonitorId = async ({ monitorId, teamId }: { monitorId: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId);
	};

	deleteMaintenanceWindow = async ({ id, teamId }: { id: string; teamId: string }) => {
		return await this.maintenanceWindowsRepository.deleteById(id, teamId);
	};

	editMaintenanceWindow = async ({ id, teamId, body }: { id: string; teamId: string; body: Partial<MaintenanceWindow> }) => {
		return await this.maintenanceWindowsRepository.updateById(id, teamId, body);
	};
}
