import { IMaintenanceWindowsRepository, IMonitorsRepository } from "@/repositories/index.js";
import type { DurationUnit, MaintenanceWindow } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";

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
	editMaintenanceWindow(params: {
		id: string;
		teamId: string;
		body: Partial<Omit<MaintenanceWindow, "monitorIds">> & { monitors?: string[] };
	}): Promise<MaintenanceWindow>;
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

	private flipMonitorsLeavingMaintenance = async (monitorIds: string[], teamId: string, excludeWindowId: string, now: Date): Promise<void> => {
		if (monitorIds.length === 0) return;

		const otherWindows = await this.maintenanceWindowsRepository.findByMonitorIds(monitorIds, teamId, excludeWindowId);
		const stillCovered = new Set<string>();
		for (const otherWindow of otherWindows) {
			if (!isWindowActive(otherWindow, now)) continue;
			for (const monitorId of otherWindow.monitorIds) {
				if (monitorIds.includes(monitorId)) stillCovered.add(monitorId);
			}
		}

		const toInitializing = monitorIds.filter((monitorId) => !stillCovered.has(monitorId));
		if (toInitializing.length > 0) {
			await this.monitorsRepository.updateByIds(toInitializing, teamId, { status: "initializing" }, ["paused"]);
		}
	};

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

		const created = await this.maintenanceWindowsRepository.create({
			teamId,
			monitorIds: monitorIDs,
			name: name,
			active: active,
			duration: duration,
			durationUnit: durationUnit,
			repeat: repeat,
			start: start,
			end: end,
		});

		if (isWindowActive(created)) {
			await this.monitorsRepository.updateByIds(created.monitorIds, teamId, { status: "maintenance" }, ["paused"]);
		}
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
		const deleted = await this.maintenanceWindowsRepository.deleteById(id, teamId);

		const now = new Date();
		if (isWindowActive(deleted, now)) {
			await this.flipMonitorsLeavingMaintenance(deleted.monitorIds, teamId, deleted.id, now);
		}

		return deleted;
	};

	editMaintenanceWindow = async ({
		id,
		teamId,
		body,
	}: {
		id: string;
		teamId: string;
		body: Partial<Omit<MaintenanceWindow, "monitorIds">> & { monitors?: string[] };
	}) => {
		const existing = await this.maintenanceWindowsRepository.findById(id, teamId);

		const { monitors, ...rest } = body;
		const update: Partial<MaintenanceWindow> = rest;

		if (monitors !== undefined) {
			const monitorDocs = await this.monitorsRepository.findByIds(monitors);
			const unauthorizedMonitors = monitorDocs.filter((monitor) => monitor.teamId !== teamId);
			if (unauthorizedMonitors.length > 0) {
				throw new AppError({
					message: "Unauthorized to edit maintenance window for one or more monitors",
					service: SERVICE_NAME,
					method: "editMaintenanceWindow",
					status: 403,
				});
			}
			update.monitorIds = monitors;
		}

		const updated = await this.maintenanceWindowsRepository.updateById(id, teamId, update);

		const now = new Date();
		const wasActive = isWindowActive(existing, now);
		const isActive = isWindowActive(updated, now);

		const enteringMaintenance = isActive ? updated.monitorIds.filter((monitorId) => !wasActive || !existing.monitorIds.includes(monitorId)) : [];

		const leavingCandidates = wasActive ? existing.monitorIds.filter((monitorId) => !isActive || !updated.monitorIds.includes(monitorId)) : [];

		if (enteringMaintenance.length > 0) {
			await this.monitorsRepository.updateByIds(enteringMaintenance, teamId, { status: "maintenance" }, ["paused"]);
		}

		if (leavingCandidates.length > 0) {
			await this.flipMonitorsLeavingMaintenance(leavingCandidates, teamId, existing.id, now);
		}

		return updated;
	};
}
