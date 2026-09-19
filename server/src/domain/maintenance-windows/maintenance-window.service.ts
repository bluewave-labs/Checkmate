import { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
import type { DurationUnit, MaintenanceWindow } from "@/domain/maintenance-windows/maintenance-window.type.js";
import { AppError } from "@/utils/AppError.js";
import { isWindowActive, windowCoversMonitor } from "@/utils/maintenanceWindow.js";
import { IJobScheduler } from "@/worker/worker.interface.js";

const SERVICE_NAME = "maintenanceWindowService";

// Maps the calling method to the verb used in ownership error messages
const VERB_BY_METHOD = { createMaintenanceWindow: "create", editMaintenanceWindow: "edit" } as const;
type OwnershipCheckMethod = keyof typeof VERB_BY_METHOD;

export interface IMaintenanceWindowService {
	createMaintenanceWindow(params: {
		teamId: string;
		monitorIDs: string[];
		tagIDs: string[];
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
		body: Partial<Omit<MaintenanceWindow, "monitorIds" | "tagIds">> & { monitors?: string[]; tags?: string[] };
	}): Promise<MaintenanceWindow>;
}

export class MaintenanceWindowService implements IMaintenanceWindowService {
	static SERVICE_NAME = SERVICE_NAME;
	private monitorsRepository: IMonitorsRepository;
	private maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	private tagsRepository: ITagsRepository;
	private jobsRepository: IJobsRepository;
	private scheduler: IJobScheduler;

	constructor({
		monitorsRepository,
		maintenanceWindowsRepository,
		tagsRepository,
		jobsRepository,
		scheduler,
	}: {
		monitorsRepository: IMonitorsRepository;
		maintenanceWindowsRepository: IMaintenanceWindowsRepository;
		tagsRepository: ITagsRepository;
		jobsRepository: IJobsRepository;
		scheduler: IJobScheduler;
	}) {
		this.monitorsRepository = monitorsRepository;
		this.maintenanceWindowsRepository = maintenanceWindowsRepository;
		this.tagsRepository = tagsRepository;
		this.jobsRepository = jobsRepository;
		this.scheduler = scheduler;
	}

	private assertMonitorsOwned = async (monitorIds: string[], teamId: string, method: OwnershipCheckMethod): Promise<void> => {
		if (monitorIds.length === 0) return;
		const monitors = await this.monitorsRepository.findByIds(monitorIds, { recentChecks: "none" });
		const unauthorizedMonitors = monitors.filter((monitor) => monitor.teamId !== teamId);
		if (unauthorizedMonitors.length > 0) {
			throw new AppError({
				message: `Unauthorized to ${VERB_BY_METHOD[method]} maintenance window for one or more monitors`,
				service: SERVICE_NAME,
				method,
				status: 403,
			});
		}
	};

	private assertTagsOwned = async (tagIds: string[], teamId: string, method: OwnershipCheckMethod): Promise<void> => {
		if (tagIds.length === 0) return;
		const tags = await this.tagsRepository.findByIds(tagIds, teamId);
		if (tags.length !== new Set(tagIds).size) {
			throw new AppError({
				message: `Unauthorized to ${VERB_BY_METHOD[method]} maintenance window for one or more tags`,
				service: SERVICE_NAME,
				method,
				status: 403,
			});
		}
	};

	// The monitors a window covers: those listed directly plus every team monitor carrying one of its tags.
	// Union semantics, so a monitor picked both ways is included once.
	private resolveMonitorIds = async (window: MaintenanceWindow): Promise<string[]> => {
		const taggedMonitorIds = await this.monitorsRepository.findIdsByTagIds(window.tagIds, window.teamId);
		return Array.from(new Set([...window.monitorIds, ...taggedMonitorIds]));
	};

	private flipMonitorsLeavingMaintenance = async (monitorIds: string[], teamId: string, excludeWindowId: string, now: Date): Promise<void> => {
		if (monitorIds.length === 0) return;

		// Other windows may still cover a leaving monitor through its tags, so look those up as well
		const monitors = await this.monitorsRepository.findByIds(monitorIds, { recentChecks: "none" });
		const tagIdsByMonitor = new Map(monitors.map((monitor) => [monitor.id, monitor.tags ?? []]));
		const tagIds = Array.from(new Set(monitors.flatMap((monitor) => monitor.tags ?? [])));

		const otherWindows = await this.maintenanceWindowsRepository.findByMonitorIds(monitorIds, teamId, excludeWindowId, tagIds);
		const stillCovered = new Set<string>();
		for (const otherWindow of otherWindows) {
			if (!isWindowActive(otherWindow, now)) continue;
			for (const monitorId of monitorIds) {
				if (windowCoversMonitor(otherWindow, monitorId, tagIdsByMonitor.get(monitorId))) stillCovered.add(monitorId);
			}
		}

		const toInitializing = monitorIds.filter((monitorId) => !stillCovered.has(monitorId));
		if (toInitializing.length > 0) {
			await this.monitorsRepository.updateByIds(toInitializing, teamId, { status: "initializing" }, ["paused"]);
			// Rearm jobs to run soon (now + jitter to avoid herding)
			await this.jobsRepository.markMonitorsDue(toInitializing, now.getTime());
			// Wake the (possibly idle, backed-off) loops so the rearmed jobs run promptly instead of waiting up to POLL_MAX_MS
			this.scheduler.wake("check");
			this.scheduler.wake("geo-check");
		}
	};

	createMaintenanceWindow = async ({
		teamId,
		monitorIDs,
		tagIDs,
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
		tagIDs: string[];
		name: string;
		active: boolean;
		duration: number;
		durationUnit: DurationUnit;
		repeat: number;
		start: string;
		end: string;
	}) => {
		await this.assertMonitorsOwned(monitorIDs, teamId, "createMaintenanceWindow");
		await this.assertTagsOwned(tagIDs, teamId, "createMaintenanceWindow");

		const created = await this.maintenanceWindowsRepository.create({
			teamId,
			monitorIds: monitorIDs,
			tagIds: tagIDs,
			name: name,
			active: active,
			duration: duration,
			durationUnit: durationUnit,
			repeat: repeat,
			start: start,
			end: end,
		});

		if (isWindowActive(created)) {
			const coveredMonitorIds = await this.resolveMonitorIds(created);
			if (coveredMonitorIds.length > 0) {
				await this.monitorsRepository.updateByIds(coveredMonitorIds, teamId, { status: "maintenance" }, ["paused"]);
			}
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
		const monitor = await this.monitorsRepository.findById(monitorId, teamId);
		return await this.maintenanceWindowsRepository.findByMonitorId(monitorId, teamId, monitor.tags ?? []);
	};

	deleteMaintenanceWindow = async ({ id, teamId }: { id: string; teamId: string }) => {
		const deleted = await this.maintenanceWindowsRepository.deleteById(id, teamId);

		const now = new Date();
		if (isWindowActive(deleted, now)) {
			await this.flipMonitorsLeavingMaintenance(await this.resolveMonitorIds(deleted), teamId, deleted.id, now);
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
		body: Partial<Omit<MaintenanceWindow, "monitorIds" | "tagIds">> & { monitors?: string[]; tags?: string[] };
	}) => {
		const existing = await this.maintenanceWindowsRepository.findById(id, teamId);

		const { monitors, tags, ...rest } = body;
		const update: Partial<MaintenanceWindow> = rest;

		if (monitors !== undefined) {
			await this.assertMonitorsOwned(monitors, teamId, "editMaintenanceWindow");
			update.monitorIds = monitors;
		}

		if (tags !== undefined) {
			await this.assertTagsOwned(tags, teamId, "editMaintenanceWindow");
			update.tagIds = tags;
		}

		// A window must keep at least one target once the partial update is applied
		const nextMonitorIds = update.monitorIds ?? existing.monitorIds;
		const nextTagIds = update.tagIds ?? existing.tagIds;
		if (nextMonitorIds.length === 0 && nextTagIds.length === 0) {
			throw new AppError({
				message: "At least one monitor or tag is required",
				service: SERVICE_NAME,
				method: "editMaintenanceWindow",
				status: 400,
			});
		}

		// Resolve tag membership before the update so both sides reflect the same monitor set
		const existingMonitorIds = await this.resolveMonitorIds(existing);

		const updated = await this.maintenanceWindowsRepository.updateById(id, teamId, update);
		const updatedMonitorIds = await this.resolveMonitorIds(updated);

		const now = new Date();
		const wasActive = isWindowActive(existing, now);
		const isActive = isWindowActive(updated, now);

		const enteringMaintenance = isActive ? updatedMonitorIds.filter((monitorId) => !wasActive || !existingMonitorIds.includes(monitorId)) : [];

		const leavingCandidates = wasActive ? existingMonitorIds.filter((monitorId) => !isActive || !updatedMonitorIds.includes(monitorId)) : [];

		if (enteringMaintenance.length > 0) {
			await this.monitorsRepository.updateByIds(enteringMaintenance, teamId, { status: "maintenance" }, ["paused"]);
		}

		if (leavingCandidates.length > 0) {
			await this.flipMonitorsLeavingMaintenance(leavingCandidates, teamId, existing.id, now);
		}

		return updated;
	};
}
