const SERVICE_NAME = "JobQueueHelper";
import { ISettingsService } from "@/domain/app-settings/app-settings.service.js";
import { ICheckService } from "@/domain/checks/check.service.js";
import { CHECK_TTL_SENTINEL } from "@/domain/checks/check.type.js";
import { IChecksRepository } from "@/domain/checks/check.repository.interface.js";
import { IGeoChecksRepository } from "@/domain/geo-checks/geo-check.repository.interface.js";
import { IIncidentsRepository } from "@/domain/incidents/incident.repository.interface.js";
import { IMonitorStatsRepository } from "@/domain/monitor-stats/monitor-stats.repository.interface.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { IJobsRepository } from "@/domain/jobs/job.repository.interface.js";
import { ITeamsRepository } from "@/domain/teams/team.repository.interface.js";
import { ILogger } from "@/utils/logger/logger.js";
import { IDockerLogsRepository } from "@/domain/docker/docker-log.repository.interface.js";
import { IEgressService } from "@/domain/egress/egress.service.js";
import { ITelemetryService } from "@/domain/telemetry/telemetry.service.js";
import type { Job } from "@/domain/jobs/job.type.js";

export interface IWorkerHelper {
	getCleanupOrphanedJob(): () => Promise<void>;
	getCleanupRetentionJob(): () => Promise<void>;
	getEgressRecoveryJob(): (job: Job) => Promise<void>;
	getTelemetryJob(): () => Promise<void>;
}

export class WorkerHelper implements IWorkerHelper {
	static SERVICE_NAME = SERVICE_NAME;

	private logger: ILogger;
	private checkService: ICheckService;
	private settingsService: ISettingsService;
	private monitorsRepository: IMonitorsRepository;
	private jobsRepository: IJobsRepository;
	private teamsRepository: ITeamsRepository;
	private monitorStatsRepository: IMonitorStatsRepository;
	private checksRepository: IChecksRepository;
	private incidentsRepository: IIncidentsRepository;
	private geoChecksRepository: IGeoChecksRepository;
	private dockerLogsRepository: IDockerLogsRepository;
	private egressService: IEgressService;
	private telemetryService: ITelemetryService;

	constructor(
		logger: ILogger,
		checkService: ICheckService,
		settingsService: ISettingsService,
		monitorsRepository: IMonitorsRepository,
		jobsRepository: IJobsRepository,
		teamsRepository: ITeamsRepository,
		monitorStatsRepository: IMonitorStatsRepository,
		checksRepository: IChecksRepository,
		incidentsRepository: IIncidentsRepository,
		geoChecksRepository: IGeoChecksRepository,
		dockerLogsRepository: IDockerLogsRepository,
		egressService: IEgressService,
		telemetryService: ITelemetryService
	) {
		this.logger = logger.child({ service: SERVICE_NAME });
		this.checkService = checkService;
		this.settingsService = settingsService;
		this.monitorsRepository = monitorsRepository;
		this.jobsRepository = jobsRepository;
		this.teamsRepository = teamsRepository;
		this.monitorStatsRepository = monitorStatsRepository;
		this.checksRepository = checksRepository;
		this.incidentsRepository = incidentsRepository;
		this.geoChecksRepository = geoChecksRepository;
		this.dockerLogsRepository = dockerLogsRepository;
		this.egressService = egressService;
		this.telemetryService = telemetryService;
	}

	// Runs while instance egress is degraded; the service removes the row once egress is back.
	// Errors from the probe propagate so the queue records the failure and retries with its usual backoff.
	getEgressRecoveryJob = () => {
		return async (job: Job) => {
			await this.egressService.checkRecovery(job);
		};
	};

	getTelemetryJob = () => {
		return async () => {
			await this.telemetryService.handleJob();
		};
	};

	getCleanupOrphanedJob = () => {
		return async () => {
			try {
				this.logger.info("Starting cleanup of orphaned data");

				// Get all valid team IDs
				const validTeamIds = await this.teamsRepository.findAllTeamIds();
				this.logger.debug({ count: validTeamIds.length }, "Found valid teams");

				// Remove orphaned monitors (monitors without a valid team)
				const deletedMonitorCount = await this.monitorsRepository.deleteByTeamIdsNotIn(validTeamIds);
				if (deletedMonitorCount > 0) {
					this.logger.info({ count: deletedMonitorCount }, "Deleted orphaned monitors");
				}

				// Remove orphaned monitorStats (stats without a valid monitor)
				const allMonitorIds = await this.monitorsRepository.findAllMonitorIds();
				this.logger.debug({ count: allMonitorIds.length }, "Found valid monitors");

				const deletedStatsCount = await this.monitorStatsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedStatsCount > 0) {
					this.logger.info({ count: deletedStatsCount }, "Deleted orphaned monitor stats");
				}

				// Remove orphaned checks
				const deletedChecksCount = await this.checksRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedChecksCount > 0) {
					this.logger.info({ count: deletedChecksCount }, "Deleted orphaned checks");
				}

				// Remove orphaned incidents
				const deletedIncidentsCount = await this.incidentsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedIncidentsCount > 0) {
					this.logger.info({ count: deletedIncidentsCount }, "Deleted orphaned incidents");
				}

				// Remove orphaned geo checks
				const deletedGeoChecksCount = await this.geoChecksRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedGeoChecksCount > 0) {
					this.logger.info({ count: deletedGeoChecksCount }, "Deleted orphaned geo checks");
				}

				const deletedDockerLogsCount = await this.dockerLogsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedDockerLogsCount > 0) {
					this.logger.info({ count: deletedDockerLogsCount }, "Deleted orphaned docker logs");
				}

				// Remove orphaned jobs
				const deletedJobsCount = await this.jobsRepository.deleteByMonitorIdsNotIn(allMonitorIds);
				if (deletedJobsCount > 0) {
					this.logger.info({ count: deletedJobsCount }, "Deleted orphaned jobs");
				}

				this.logger.info("Cleanup of orphaned data completed");
			} catch (error: unknown) {
				this.logger.warn({ err: error }, "Cleanup of orphaned data failed");
				throw error;
			}
		};
	};

	getCleanupRetentionJob = () => {
		return async () => {
			try {
				const settings = await this.settingsService.getDBSettings();

				const checkTTL = settings.checkTTL; // Check TTL is in DAYS, not MS

				if (checkTTL === CHECK_TTL_SENTINEL) {
					this.logger.info("Check TTL is set to unlimited, skipping cleanup");
					return;
				}
				const checkTTLInMs = checkTTL * 24 * 60 * 60 * 1000;
				const cutoffDate = new Date(Date.now() - checkTTLInMs);
				const deleteCount = await this.checkService.deleteOlderThan(cutoffDate);
				this.logger.info({ count: deleteCount, cutoff: cutoffDate.toISOString() }, "Deleted checks older than the retention cutoff");
			} catch (error: unknown) {
				this.logger.error({ err: error }, "Retention cleanup failed");
			}
		};
	};
}
