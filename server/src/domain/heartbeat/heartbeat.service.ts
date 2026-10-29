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
import { HEARTBEAT_FAIL_CODE, HEARTBEAT_UP_CODE, type HeartbeatAction } from "@/domain/heartbeat/heartbeat.type.js";

const SERVICE_NAME = "HeartbeatService";

type RecordPingArgs = {
	pingKey: string;
	slug: string;
	action: HeartbeatAction;
	exitCode?: number;
	message?: string;
	duration?: number;
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
}

export class HeartbeatService implements IHeartbeatService {
	static SERVICE_NAME = SERVICE_NAME;
	private logger: ILogger;

	constructor(private deps: HeartbeatServiceDependencies) {
		this.logger = deps.logger.child({ service: SERVICE_NAME });
	}

	recordPing = async ({ pingKey, slug, action, exitCode, message, duration }: RecordPingArgs): Promise<void> => {
		const team = await this.deps.teamsRepository.findByHeartbeatKeyHash(this.deps.encryptionService.hash(pingKey));
		if (!team) throw new AppError(heartbeatErrors.notFound, { service: SERVICE_NAME });

		const monitor = await this.deps.monitorsRepository.findHeartbeatBySlug(team.id, slug);

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
