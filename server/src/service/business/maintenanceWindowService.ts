import { IMaintenanceWindowsRepository, IMonitorsRepository } from "@/repositories/index.js";
import type { DurationUnit, MaintenanceWindow } from "@/types/index.js";
import { AppError } from "@/utils/AppError.js";
import { randomUUID } from "node:crypto";

const SERVICE_NAME = "maintenanceWindowService";

type EditMaintenanceWindowBody = Partial<MaintenanceWindow> & {
	monitors?: string[];
};

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
	editMaintenanceWindow(params: { id: string; teamId: string; body: EditMaintenanceWindowBody }): Promise<MaintenanceWindow>;
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
		const uniqueMonitorIDs = [...new Set(monitorIDs)];
		const monitors = await this.monitorsRepository.findByIds(uniqueMonitorIDs);

		const unauthorizedMonitors = monitors.length !== uniqueMonitorIDs.length || monitors.some((monitor) => monitor.teamId !== teamId);

		if (unauthorizedMonitors) {
			throw new AppError({
				message: "Unauthorized to create maintenance window for one or more monitors",
				service: SERVICE_NAME,
				method: "createMaintenanceWindow",
				status: 403,
			});
		}

		const groupId = randomUUID();
		const dbTransactions = uniqueMonitorIDs.map((monitorId: string) => {
			return this.maintenanceWindowsRepository.create({
				groupId,
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
		const maintenanceWindow = await this.maintenanceWindowsRepository.findById(id, teamId);
		const relatedWindows = await this.getRelatedWindows(maintenanceWindow);
		return {
			...maintenanceWindow,
			monitors: relatedWindows.map((relatedWindow) => relatedWindow.monitorId),
		};
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
		const maintenanceWindow = await this.maintenanceWindowsRepository.findById(id, teamId);
		const relatedWindows = await this.getRelatedWindows(maintenanceWindow);
		const deletedWindows = await Promise.all(
			relatedWindows.map((relatedWindow) => this.maintenanceWindowsRepository.deleteById(relatedWindow.id, teamId))
		);
		return deletedWindows.find((deletedWindow) => deletedWindow.id === id) ?? deletedWindows[0] ?? maintenanceWindow;
	};

	private verifyMonitorOwnership = async (monitorIDs: string[], teamId: string, method: string, message: string) => {
		const uniqueMonitorIDs = [...new Set(monitorIDs)];
		const monitors = await this.monitorsRepository.findByIds(uniqueMonitorIDs);

		const unauthorizedMonitors = monitors.length !== uniqueMonitorIDs.length || monitors.some((monitor) => monitor.teamId !== teamId);

		if (unauthorizedMonitors) {
			throw new AppError({
				message,
				service: SERVICE_NAME,
				method,
				status: 403,
			});
		}
	};

	private getRelatedWindows = async (maintenanceWindow: MaintenanceWindow) => {
		const relatedWindows = await this.maintenanceWindowsRepository.findRelated(maintenanceWindow);
		return relatedWindows.length > 0 ? relatedWindows : [maintenanceWindow];
	};

	editMaintenanceWindow = async ({ id, teamId, body }: { id: string; teamId: string; body: EditMaintenanceWindowBody }) => {
		const { monitors, ...updates } = body;
		const maintenanceWindow = await this.maintenanceWindowsRepository.findById(id, teamId);
		const relatedWindows = await this.getRelatedWindows(maintenanceWindow);
		const groupId = maintenanceWindow.groupId ?? randomUUID();

		if (monitors === undefined) {
			const updatedWindows = await Promise.all(
				relatedWindows.map((relatedWindow) =>
					this.maintenanceWindowsRepository.updateById(relatedWindow.id, teamId, {
						...updates,
						groupId,
					})
				)
			);
			return updatedWindows.find((updatedWindow) => updatedWindow.id === id) ?? updatedWindows[0] ?? maintenanceWindow;
		}

		const selectedMonitorIDs = [...new Set(monitors)];

		await this.verifyMonitorOwnership(
			selectedMonitorIDs,
			teamId,
			"editMaintenanceWindow",
			"Unauthorized to edit maintenance window for one or more monitors"
		);

		const selectedMonitorIds = new Set(selectedMonitorIDs);
		const existingWindowsByMonitorId = new Map(relatedWindows.map((relatedWindow) => [relatedWindow.monitorId, relatedWindow]));
		const selectedExistingWindows = relatedWindows.filter((relatedWindow) => selectedMonitorIds.has(relatedWindow.monitorId));
		const removedWindows = relatedWindows.filter((relatedWindow) => !selectedMonitorIds.has(relatedWindow.monitorId));
		const addedMonitorIds = selectedMonitorIDs.filter((monitorId) => !existingWindowsByMonitorId.has(monitorId));

		const baseWindow = { ...maintenanceWindow, ...updates, groupId };
		const updatedWindows = await Promise.all([
			...selectedExistingWindows.map((relatedWindow) =>
				this.maintenanceWindowsRepository.updateById(relatedWindow.id, teamId, {
					...updates,
					groupId,
				})
			),
			...addedMonitorIds.map((monitorId) =>
				this.maintenanceWindowsRepository.create({
					teamId,
					groupId,
					monitorId,
					active: baseWindow.active,
					name: baseWindow.name,
					duration: baseWindow.duration,
					durationUnit: baseWindow.durationUnit,
					repeat: baseWindow.repeat,
					start: baseWindow.start,
					end: baseWindow.end,
				})
			),
		]);

		await Promise.all(removedWindows.map((relatedWindow) => this.maintenanceWindowsRepository.deleteById(relatedWindow.id, teamId)));

		return updatedWindows.find((updatedWindow) => updatedWindow.id === id) ?? updatedWindows[0] ?? maintenanceWindow;
	};
}
