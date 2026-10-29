import { AppError, internalError } from "@/utils/AppError.js";
import { isWindowActive } from "@/utils/maintenanceWindow.js";
import type { ILogger } from "@/utils/logger/logger.js";
import type { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import type { IMaintenanceWindowsRepository } from "@/domain/maintenance-windows/maintenance-window.repository.interface.js";
import type { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import type { ICheckService } from "@/domain/checks/check.service.js";
import type { IJobScheduler } from "@/worker/worker.interface.js";
import type { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import type { IEncryptionService } from "@/service/encryption/encryptionService.js";
import { heartbeatErrors } from "@/domain/heartbeat/heartbeat.errors.js";
import { HEARTBEAT_DEFAULT_INTERVAL_MS, HEARTBEAT_FAIL_CODE, HEARTBEAT_UP_CODE, type HeartbeatAction } from "@/domain/heartbeat/heartbeat.type.js";
import { IUsersRepository } from "@/domain/users/user.repository.interface.js";
import { IMonitorService } from "@/domain/monitors/monitor.service.js";
import { Team } from "@/domain/teams/team.type.js";
import { monitorErrors } from "@/domain/monitors/monitor.errors.js";
import { Monitor } from "@/domain/monitors/monitor.type.js";

const SERVICE_NAME = "HeartbeatService";

type RecordPingArgs = {
	pingKey: string;
	slug: string;
	action: HeartbeatAction;
	exitCode?: number;
	message?: string;
	duration?: number;
	create?: boolean;
	interval?: boolean;
};

export interface IHeartbeatService {
	recordPing: (args: RecordPingArgs) => Promise<void>;
}

export interface HeartbeatServiceDependencies {
	logger: ILogger;
	teamsRepository: ITeamsRepository;
	encryptionService: IEncryptionService;
	monitorsRepository: IMonitorsRepository;
	maintenanceWindowsRepository: IMaintenanceWindowsRepository;
	jobsRepository: IJobsRepository;
	checkService: ICheckService;
	scheduler: IJobScheduler;
	usersRepository: IUsersRepository;
	monitorService: IMonitorService;
}

export class HeartbeatService implements IHeartbeatService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(private deps: HeartbeatServiceDependencies) {
		this.logger = deps.logger.child({ service: SERVICE_NAME });
	}

	private resolveOwner = async (team: Team): Promise<string> => {
		const keyCreator = team.heartbeatKeyCreatedBy ? await this.deps.usersRepository.findIdInTeam(team.heartbeatKeyCreatedBy, team.id) : null;
		const owner = keyCreator ? keyCreator : await this.deps.usersRepository.findSuperAdminIdByTeamId(team.id);
		if (!owner) throw new AppError(internalError, { message: "No owner for auto-created heartbeat monitor", service: SERVICE_NAME });
		return owner;
	};

	private createFromPing = async (team: Team, slug: string, interval?: number) => {
		const onwerId = await this.resolveOwner(team);
		const body: Partial<Monitor> = {
			type: "heartbeat",
			name: slug,
			heartbeatSlug: slug,
			interval: interval ?? HEARTBEAT_DEFAULT_INTERVAL_MS,
			isActive: true,
		};

		try {
			const monitor = await this.deps.monitorService.createMonitor(team.id, ownerId, body);
			this.logger.info({ teamId: team.id, slug, monitorId: monitor.id }, "Heartbeat monitor auto-created");
			return monitor;
		} catch (error: unknown) {
			if (error instanceof AppError && error.definition === monitorErrors.heartbeatSlugTaken) {
				return this.deps.monitorsRepository.findHeartbeatBySlug(team.id, slug);
			}
			throw error;
		}
	};

	recordPing = async ({ pingKey, slug, action, exitCode, message, duration, create, interval }: RecordPingArgs): Promise<void> => {
		const team = await this.deps.teamsRepository.findByHeartbeatKeyHash(this.deps.encryptionService.hash(pingKey));
		if (!team) throw new AppError(heartbeatErrors.notFound, { service: SERVICE_NAME });

		let monitor = await this.deps.monitorsRepository.findHeartbeatBySlug(team.id, slug);

		if (!monitor && create) {
			monitor = await this.createFromPing(team, slug, interval);
		}

		if (!monitor) {
			throw new AppError(heartbeatErrors.notFound, { service: SERVICE_NAME });
		}

		if (!monitor.isActive) return;

		// Push back the job for this monitor (pushing back the dead man's switch)
		const now = Date.now();
		await this.deps.jobsRepository.rescheduleChecks([monitor.id], now);

		const windows = await this.deps.maintenanceWindowsRepository.findByMonitorId(monitor.id, monitor.teamId);
		if (windows.some((window) => isWindowActive(window, new Date(now)))) return;

		// Now that we received the ping, determine what kind of check to create
		const exited = exitCode !== undefined && exitCode > 0;
		const failed = action === "fail" || exited;

		const defaultMessage = exited ? `Exited with code ${exitCode}` : failed ? "Reported failure" : "Ping received";

		const check = this.deps.checkService.toCheck({
			monitorId: monitor.id,
			teamId: monitor.teamId,
			type: "heartbeat",
			status: !failed,
			code: failed ? HEARTBEAT_FAIL_CODE : HEARTBEAT_UP_CODE,
			message: message || defaultMessage,
			responseTime: duration ?? 0,
			payload: null,
		});

		if (!check) {
			throw new AppError(internalError, { message: "No check built for heartbeat", service: SERVICE_NAME });
		}

		await this.deps.checkService.createChecks([check]);
		await this.deps.jobsRepository.upsertEvaluate(monitor.id, [{ checkId: check.id, createdAt: new Date(check.createdAt).getTime() }], now);
		this.deps.scheduler.wake("evaluate");
	};
}
